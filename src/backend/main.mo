import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  include MixinStorage();

  type WarrantyStatus = { #inWarranty; #outWarranty };
  type PaymentStatus = { #paid; #unpaid; #free };
  type PaymentMethod = { #upi; #cash };
  type ServiceType = { #cleaning; #maintenance; #repair; #other : Text };

  type AMCType = {
    #onlyService;
    #serviceWithParts;
    #serviceWithParts50;
  };

  type AMCPaymentMethod = {
    #cash;
    #bankTransfer;
    #online;
    #cheque;
    #other : Text;
  };

  type AMCDetails = {
    id : Nat;
    contractType : AMCType;
    durationYears : Nat;
    contractStartDate : Time.Time;
    contractEndDate : Time.Time;
    paymentMethod : AMCPaymentMethod;
    totalAmount : Nat;
    notes : Text;
    remainingBalance : Nat;
  };

  type AMCContract = {
    startDate : Time.Time;
    endDate : Time.Time;
    contractType : AMCType;
    amount : Nat;
    owner : Principal;
  };

  type ContractStatus = { 
    #active; 
    #expired; 
    #pendingRenewal; 
  };

  type AMCServiceEntry = {
    amcServiceId : Nat;
    customerServiceId : Nat;
    contractType : AMCType;
    serviceDate : Time.Time;
    contractStatus : ContractStatus;
    partsReplaced : Text;
    notes : Text;
    followUpNeeded : Bool;
    priceReduction : ?{ partsName : Text; regularPrice : Text; discountPrice : Text };
  };

  type Reminder = {
    id : Nat;
    owner : Principal;
    customerId : Nat;
    reminderDate : Time.Time;
    description : Text;
    sentStatus : Bool;
  };

  type ServiceEntry = {
    id : Nat;
    owner : Principal;
    customerId : Nat;
    serviceDate : Time.Time;
    serviceType : ServiceType;
    amount : Nat;
    paymentStatus : PaymentStatus;
    paymentMethod : ?PaymentMethod;
    notes : Text;
    isFree : Bool;
  };

  type Customer = {
    id : Nat;
    owner : Principal;
    name : Text;
    contact : Text;
    serviceType : ServiceType;
    installationDate : Time.Time;
    nextServiceDate : Time.Time;
    warrantyStatus : WarrantyStatus;
    serviceInterval : Nat;
    brand : Text;
    model : Text;
    amcDetails : ?AMCDetails;
    amcServices : [AMCServiceEntry];
    amcContracts : [AMCContract];
  };

  type ImportCustomerData = {
    name : Text;
    contact : Text;
    brand : Text;
    model : Text;
    serviceType : ServiceType;
    installationDate : Time.Time;
    serviceInterval : Nat;
  };

  type ImportResult = {
    successCount : Nat;
    failureCount : Nat;
    errors : [Text];
  };

  type RevenueByPeriod = {
    totalRevenue : Nat;
    paidServicesCount : Nat;
    freeServicesCount : Nat;
  };

  type AMCRevenue = {
    totalAmount : Nat;
    inProgressAmount : Nat;
    completedAmount : Nat;
    remainingBalance : Nat;
  };

  type CustomerRevenueBreakdown = {
    customerId : Nat;
    customerName : Text;
    paidServicesCount : Nat;
    freeServicesCount : Nat;
    totalRevenue : Nat;
    amcRenewalCount : Nat;
    contractType : ?AMCType;
  };

  type PaymentMethodBreakdown = {
    upiPayments : Nat;
    cashPayments : Nat;
    bankTransfer : Nat;
    chequePayments : Nat;
    onlinePayments : Nat;
    otherPayments : Nat;
  };

  public type AMCDuration = {
    startDate : Time.Time;
    endDate : Time.Time;
    contractType : AMCType;
    amount : Nat;
  };

  var nextCustomerId = 1;
  var nextServiceId = 1;
  var nextReminderId = 1;
  var nextAMCServiceId = 1;

  let customersMap = Map.empty<Nat, Customer>();
  let servicesMap = Map.empty<Nat, ServiceEntry>();
  let remindersMap = Map.empty<Nat, Reminder>();

  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  module Customer {
    public func compare(a : Customer, b : Customer) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  module Reminder {
    public func compare(a : Reminder, b : Reminder) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  func checkAuthorization(caller : Principal, owner : Principal) : Bool {
    caller == owner or AccessControl.isAdmin(accessControlState, caller)
  };

  func normalizeIndianPhoneNumber(phone : Text) : Text {
    let trimmed = trimWhitespace(phone);
    if (trimmed.startsWith(#text("0")) or trimmed.startsWith(#text("+"))) {
      return trimmed;
    };
    if (trimmed.size() == 10) { "+91" # trimmed } else {
      trimmed;
    };
  };

  func trimWhitespace(str : Text) : Text {
    let chars : [Char] = str.toArray();
    if (chars.size() == 0) { return str };

    var start = 0;
    while (start < chars.size() and (chars[start] == '\t' or chars[start] == ' ')) {
      start += 1;
    };

    var end = chars.size();
    while (end > start and (chars[end - 1] == '\t' or chars[end - 1] == ' ')) {
      end -= 1;
    };

    if (start >= end) { return "" };

    Text.fromArray(chars.sliceToArray(start, end));
  };

  public query ({ caller }) func getAllAMCs() : async [AMCDetails] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view AMC contracts");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let amcDetailsArray = customersMap.toArray().filter(
      func((_, customer)) {
        (isAdmin or customer.owner == caller) and customer.amcDetails != null
      }
    ).map(
      func((_, customer)) { customer.amcDetails }
    );

    amcDetailsArray.map(
      func(amc) {
        switch (amc) {
          case (?amcDetails) { amcDetails };
          case (_) { Runtime.trap("Unexpected: Filtering failed") };
        };
      }
    );
  };

  public query ({ caller }) func getAmcRenewalsByUser(userId : Principal) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view AMC renewals");
    };

    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own AMC renewals");
    };

    var renewalCount = 0;

    for ((_, customer) in customersMap.entries()) {
      if (customer.owner == userId and customer.amcDetails != null) {
        renewalCount += 1;
      };
    };
    renewalCount;
  };

  public shared ({ caller }) func addAMCServiceEntry(
    customerId : Nat,
    serviceDate : Time.Time,
    partsReplaced : Text,
    notes : Text,
    followUpNeeded : Bool,
    priceReduction : ?{ partsName : Text; regularPrice : Text; discountPrice : Text },
  ) : async AMCServiceEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add AMC service entries");
    };

    let customer = switch (customersMap.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?c) { c };
    };

    if (not checkAuthorization(caller, customer.owner)) {
      Runtime.trap("Unauthorized: Can only add AMC services for your own customers");
    };

    let amcDetails = switch (customer.amcDetails) {
      case (null) { Runtime.trap("Customer does not have an active AMC contract") };
      case (?amc) { amc };
    };

    let now = Time.now();
    let contractStatus : ContractStatus = if (now > amcDetails.contractEndDate) {
      #expired;
    } else if (now > amcDetails.contractEndDate - (30 * 24 * 60 * 60 * 1_000_000_000)) {
      #pendingRenewal;
    } else {
      #active;
    };

    let amcServiceEntry : AMCServiceEntry = {
      amcServiceId = nextAMCServiceId;
      customerServiceId = customerId;
      contractType = amcDetails.contractType;
      serviceDate;
      contractStatus;
      partsReplaced;
      notes;
      followUpNeeded;
      priceReduction;
    };

    let updatedAMCServices = customer.amcServices.concat([amcServiceEntry]);
    let updatedCustomer : Customer = {
      customer with amcServices = updatedAMCServices
    };
    customersMap.add(customerId, updatedCustomer);

    nextAMCServiceId += 1;
    amcServiceEntry;
  };

  public query ({ caller }) func getAMCServiceHistory(customerId : Nat) : async [AMCServiceEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view AMC service history");
    };

    let customer = switch (customersMap.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?c) { c };
    };

    if (not checkAuthorization(caller, customer.owner)) {
      Runtime.trap("Unauthorized: Can only view AMC service history for your own customers");
    };

    customer.amcServices;
  };

  public query ({ caller }) func getAMCRevenue() : async AMCRevenue {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view AMC revenue");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let now = Time.now();

    var totalAmount = 0;
    var inProgressAmount = 0;
    var completedAmount = 0;
    var remainingBalance = 0;

    for ((_, customer) in customersMap.entries()) {
      if (isAdmin or customer.owner == caller) {
        switch (customer.amcDetails) {
          case (?amc) {
            totalAmount += amc.totalAmount;
            remainingBalance += amc.remainingBalance;

            if (now <= amc.contractEndDate) {
              inProgressAmount += amc.totalAmount;
            } else {
              completedAmount += amc.totalAmount;
            };
          };
          case (null) {};
        };
      };
    };

    {
      totalAmount;
      inProgressAmount;
      completedAmount;
      remainingBalance;
    };
  };

  public query ({ caller }) func getPaymentMethodBreakdown() : async PaymentMethodBreakdown {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payment breakdowns");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    var upiPayments = 0;
    var cashPayments = 0;
    var bankTransfer = 0;
    var chequePayments = 0;
    var onlinePayments = 0;
    var otherPayments = 0;

    for ((_, service) in servicesMap.entries()) {
      if ((isAdmin or service.owner == caller) and service.paymentStatus == #paid) {
        switch (service.paymentMethod) {
          case (?#upi) { upiPayments += service.amount };
          case (?#cash) { cashPayments += service.amount };
          case (_) {};
        };
      };
    };

    for ((_, customer) in customersMap.entries()) {
      if (isAdmin or customer.owner == caller) {
        switch (customer.amcDetails) {
          case (?amc) {
            let paidAmount = amc.totalAmount - amc.remainingBalance;
            switch (amc.paymentMethod) {
              case (#cash) { cashPayments += paidAmount };
              case (#bankTransfer) { bankTransfer += paidAmount };
              case (#online) { onlinePayments += paidAmount };
              case (#cheque) { chequePayments += paidAmount };
              case (#other(_)) { otherPayments += paidAmount };
            };
          };
          case (null) {};
        };
      };
    };

    {
      upiPayments;
      cashPayments;
      bankTransfer;
      chequePayments;
      onlinePayments;
      otherPayments;
    };
  };

  public shared ({ caller }) func addCustomer(
    name : Text,
    contact : Text,
    serviceType : ServiceType,
    installationDate : Time.Time,
    serviceInterval : Nat,
    amcDetails : ?AMCDetails,
    brand : Text,
    model : Text,
  ) : async Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add customers");
    };

    validateServiceInterval(serviceInterval);

    let nextServiceDate = calculateNextServiceDate(installationDate, serviceInterval);
    let customerId = nextCustomerId;
    let reminderId = nextReminderId;

    let normalizedContact = normalizeIndianPhoneNumber(contact);

    let customer : Customer = {
      id = customerId;
      owner = caller;
      name;
      contact = normalizedContact;
      serviceType;
      installationDate;
      nextServiceDate;
      warrantyStatus = #inWarranty;
      serviceInterval;
      brand;
      model;
      amcDetails;
      amcServices = [];
      amcContracts = [];
    };

    customersMap.add(customerId, customer);

    let reminder : Reminder = {
      id = reminderId;
      owner = caller;
      customerId = customerId;
      reminderDate = nextServiceDate;
      description = "Next service for " # name;
      sentStatus = false;
    };
    remindersMap.add(reminderId, reminder);

    nextCustomerId += 1;
    nextReminderId += 1;
    customer;
  };

  public shared ({ caller }) func updateCustomer(
    id : Nat,
    name : Text,
    contact : Text,
    serviceType : ServiceType,
    installationDate : Time.Time,
    serviceInterval : Nat,
    brand : Text,
    model : Text,
    amcDetails : ?AMCDetails,
  ) : async Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update customers");
    };

    validateServiceInterval(serviceInterval);

    let existing = switch (customersMap.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) { customer };
    };

    if (not checkAuthorization(caller, existing.owner)) {
      Runtime.trap("Unauthorized: Can only update your own customers");
    };

    let nextServiceDate = calculateNextServiceDate(installationDate, serviceInterval);

    let normalizedContact = normalizeIndianPhoneNumber(contact);

    let updated : Customer = {
      id;
      owner = existing.owner;
      name;
      contact = normalizedContact;
      serviceType;
      installationDate;
      nextServiceDate;
      warrantyStatus = #inWarranty;
      serviceInterval;
      brand;
      model;
      amcDetails;
      amcServices = existing.amcServices;
      amcContracts = existing.amcContracts;
    };

    customersMap.add(id, updated);

    removeCustomerReminders(id);

    let reminder : Reminder = {
      id = nextReminderId;
      owner = caller;
      customerId = id;
      reminderDate = nextServiceDate;
      description = "Next service for " # name;
      sentStatus = false;
    };
    remindersMap.add(nextReminderId, reminder);

    nextReminderId += 1;
    updated;
  };

  public shared ({ caller }) func deleteCustomer(customerId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete customers");
    };

    switch (customersMap.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?_) {};
    };

    customersMap.remove(customerId);

    removeCustomerReminders(customerId);
    removeCustomerServices(customerId);
  };

  public shared ({ caller }) func multiDeleteCustomers(ids : [Nat]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform mass deletion");
    };

    let existingIds : [Nat] = ids.filter(
      func(id) {
        switch (customersMap.get(id)) {
          case (null) { false };
          case (?_) { true };
        };
      }
    );

    if (existingIds.size() == 0) {
      Runtime.trap("No valid customer IDs found");
    };

    for (id in existingIds.vals()) {
      customersMap.remove(id);
      removeCustomerReminders(id);
      removeCustomerServices(id);
    };
  };

  public shared ({
    caller
  }) func importCustomers(customersData : [ImportCustomerData]) : async ImportResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can import customers");
    };

    var successCount = 0;
    var failureCount = 0;
    var errors : [Text] = [];

    for (data in customersData.vals()) {
      if (isInvalidRecord(data)) {
        failureCount += 1;
        errors := errors.concat([getErrorMessage(data, failureCount)]);
      } else {
        addCustomerRecord(data, caller);
        successCount += 1;
      };
    };

    { successCount; failureCount; errors };
  };

  public shared ({ caller }) func addServiceEntry(
    customerId : Nat,
    serviceDate : Time.Time,
    serviceType : ServiceType,
    amount : Nat,
    paymentStatus : PaymentStatus,
    paymentMethod : ?PaymentMethod,
    notes : Text,
    isFree : Bool,
  ) : async ServiceEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add service entries");
    };

    let customer = switch (customersMap.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?c) { c };
    };

    if (not checkAuthorization(caller, customer.owner)) {
      Runtime.trap("Unauthorized: Can only add services for your own customers");
    };

    let finalAmount = if (isFree) { 0 } else { amount };
    let finalPaymentStatus = if (isFree) { #free } else { paymentStatus };

    let entry : ServiceEntry = {
      id = nextServiceId;
      owner = caller;
      customerId;
      serviceDate;
      serviceType;
      amount = finalAmount;
      paymentStatus = finalPaymentStatus;
      paymentMethod;
      notes;
      isFree;
    };

    servicesMap.add(nextServiceId, entry);
    nextServiceId += 1;

    removeCustomerReminders(customerId);

    let newReminderDate = calculateNextServiceDate(serviceDate, customer.serviceInterval);

    let updatedCustomer : Customer = {
      customer with nextServiceDate = newReminderDate
    };
    customersMap.add(customerId, updatedCustomer);

    let newReminder : Reminder = {
      id = nextReminderId;
      owner = caller;
      customerId = customerId;
      reminderDate = newReminderDate;
      description = "Next service for " # customer.name;
      sentStatus = false;
    };
    remindersMap.add(nextReminderId, newReminder);
    nextReminderId += 1;

    entry;
  };

  public shared ({ caller }) func updateServiceEntry(
    serviceId : Nat,
    serviceDate : Time.Time,
    serviceType : ServiceType,
    amount : Nat,
    paymentStatus : PaymentStatus,
    paymentMethod : ?PaymentMethod,
    notes : Text,
    isFree : Bool,
  ) : async ServiceEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update service entries");
    };

    let service = switch (servicesMap.get(serviceId)) {
      case (null) { Runtime.trap("Service entry not found") };
      case (?entry) { entry };
    };

    if (not checkAuthorization(caller, service.owner)) {
      Runtime.trap("Unauthorized: Can only update your own service entries");
    };

    let customer = switch (customersMap.get(service.customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?c) { c };
    };

    let finalAmount = if (isFree) { 0 } else { amount };
    let finalPaymentStatus = if (isFree) { #free } else { paymentStatus };

    let updated : ServiceEntry = {
      id = serviceId;
      owner = service.owner;
      customerId = service.customerId;
      serviceDate;
      serviceType;
      amount = finalAmount;
      paymentStatus = finalPaymentStatus;
      paymentMethod;
      notes;
      isFree;
    };

    servicesMap.add(serviceId, updated);

    removeCustomerReminders(service.customerId);

    let newReminderDate = calculateNextServiceDate(serviceDate, customer.serviceInterval);

    let updatedCustomer : Customer = {
      customer with nextServiceDate = newReminderDate
    };
    customersMap.add(service.customerId, updatedCustomer);

    let newReminder : Reminder = {
      id = nextReminderId;
      owner = caller;
      customerId = service.customerId;
      reminderDate = newReminderDate;
      description = "Next service for " # customer.name;
      sentStatus = false;
    };
    remindersMap.add(nextReminderId, newReminder);
    nextReminderId += 1;

    updated;
  };

  public shared ({ caller }) func markServiceAsDone(
    customerId : Nat,
    serviceDoneDate : Time.Time,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark services as done");
    };

    let customer = switch (customersMap.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?c) { c };
    };

    if (not checkAuthorization(caller, customer.owner)) {
      Runtime.trap("Unauthorized: Can only mark services as done for your own customers");
    };

    removeCustomerReminders(customerId);

    let newReminderDate = calculateNextServiceDate(serviceDoneDate, customer.serviceInterval);

    let updatedCustomer : Customer = {
      customer with nextServiceDate = newReminderDate
    };
    customersMap.add(customerId, updatedCustomer);

    let newReminder : Reminder = {
      id = nextReminderId;
      owner = caller;
      customerId = customerId;
      reminderDate = newReminderDate;
      description = "Next service for " # customer.name;
      sentStatus = false;
    };
    remindersMap.add(nextReminderId, newReminder);
    nextReminderId += 1;
  };

  public shared ({ caller }) func deleteServiceEntry(serviceId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete service entries");
    };

    let service = switch (servicesMap.get(serviceId)) {
      case (null) { Runtime.trap("Service entry not found") };
      case (?entry) { entry };
    };

    if (not checkAuthorization(caller, service.owner)) {
      Runtime.trap("Unauthorized: Can only delete your own service entries");
    };

    servicesMap.remove(serviceId);
  };

  public shared ({ caller }) func updatePaymentStatus(
    serviceId : Nat,
    status : PaymentStatus,
    paymentMethod : ?PaymentMethod,
  ) : async ServiceEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update payment status");
    };

    let service = switch (servicesMap.get(serviceId)) {
      case (null) { Runtime.trap("Service entry not found") };
      case (?entry) { entry };
    };

    if (not checkAuthorization(caller, service.owner)) {
      Runtime.trap("Unauthorized: Can only update your own service entries");
    };

    let updated : ServiceEntry = { service with paymentStatus = status; paymentMethod };
    servicesMap.add(serviceId, updated);
    updated;
  };

  public shared ({ caller }) func addAmc(
    customerId : Nat,
    contractType : AMCType,
    amount : Nat,
    startDate : Time.Time,
    endDate : Time.Time,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add AMCs");
    };

    let customer = switch (customersMap.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?c) { c };
    };

    if (not checkAuthorization(caller, customer.owner)) {
      Runtime.trap("Unauthorized: Can only add AMCs for your own customers");
    };

    let newAmc : AMCContract = {
      startDate;
      endDate;
      contractType;
      amount;
      owner = caller;
    };

    let updatedContracts = customer.amcContracts.concat([newAmc]);
    let updatedCustomer = { customer with amcContracts = updatedContracts };

    customersMap.add(customerId, updatedCustomer);
  };

  public shared ({ caller }) func addReminder(
    customerId : Nat,
    reminderDate : Time.Time,
    description : Text,
  ) : async Reminder {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add reminders");
    };

    let customer = switch (customersMap.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?c) { c };
    };

    if (not checkAuthorization(caller, customer.owner)) {
      Runtime.trap("Unauthorized: Can only add reminders for your own customers");
    };

    let reminder : Reminder = {
      id = nextReminderId;
      owner = caller;
      customerId;
      reminderDate;
      description;
      sentStatus = false;
    };

    remindersMap.add(nextReminderId, reminder);
    nextReminderId += 1;
    reminder;
  };

  public shared ({ caller }) func setReminderSentStatus(reminderId : Nat, status : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update reminder status");
    };

    let reminder = switch (remindersMap.get(reminderId)) {
      case (null) { Runtime.trap("Reminder not found") };
      case (?r) { r };
    };

    if (not checkAuthorization(caller, reminder.owner)) {
      Runtime.trap("Unauthorized: Can only update your own reminders");
    };

    remindersMap.add(reminderId, { reminder with sentStatus = status });
  };

  public query ({ caller }) func getCustomer(id : Nat) : async ?Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };

    switch (customersMap.get(id)) {
      case (null) { null };
      case (?customer) {
        if (checkAuthorization(caller, customer.owner)) {
          ?customer;
        } else {
          null;
        };
      };
    };
  };

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    let now = Time.now();
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let customersArray = customersMap.values().toArray().filter(
      func(customer) { isAdmin or customer.owner == caller }
    );

    customersArray.sort<Customer>().map<Customer, Customer>(
      func(customer) { updateWarrantyStatus(customer, now) }
    );
  };

  public query ({ caller }) func getCustomersByWarrantyStatus(status : WarrantyStatus) : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    let now = Time.now();
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    customersMap.values().toArray().filter<Customer>(
      func(customer) {
        (isAdmin or customer.owner == caller) and updateWarrantyStatus(customer, now).warrantyStatus == status
      }
    );
  };

  public query ({ caller }) func getServiceHistory(customerId : Nat) : async [ServiceEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view service history");
    };

    let customer = switch (customersMap.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?c) { c };
    };

    if (not checkAuthorization(caller, customer.owner)) {
      Runtime.trap("Unauthorized: Can only view service history for your own customers");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    servicesMap.values().toArray().filter<ServiceEntry>(
      func(entry) {
        entry.customerId == customerId and (isAdmin or entry.owner == caller)
      }
    );
  };

  public query ({ caller }) func getUnpaidServices() : async [ServiceEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view unpaid services");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    servicesMap.values().toArray().filter<ServiceEntry>(
      func(entry) {
        entry.paymentStatus == #unpaid and (isAdmin or entry.owner == caller)
      }
    );
  };

  public query ({ caller }) func getUpcomingReminders() : async [Reminder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reminders");
    };
    let now = Time.now();
    let sevenDaysInNanos : Int = 7 * 24 * 60 * 60 * 1_000_000_000;
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    remindersMap.values().toArray().filter<Reminder>(
      func(reminder) {
        (isAdmin or reminder.owner == caller) and
        reminder.reminderDate > now and
        reminder.reminderDate <= (now + sevenDaysInNanos)
      }
    );
  };

  public query ({ caller }) func getTodaysReminders() : async [Reminder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reminders");
    };
    let now = Time.now();
    let dayInNanos : Int = 24 * 60 * 60 * 1_000_000_000;
    let startOfDay = (now / dayInNanos) * dayInNanos;
    let endOfDay = startOfDay + dayInNanos;
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    remindersMap.values().toArray().filter<Reminder>(
      func(reminder) {
        (isAdmin or reminder.owner == caller) and
        reminder.reminderDate >= startOfDay and
        reminder.reminderDate < endOfDay
      }
    );
  };

  public query ({ caller }) func getUpcomingServices() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view upcoming services");
    };
    let now = Time.now();
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    customersMap.values().toArray().filter<Customer>(
      func(customer) {
        (isAdmin or customer.owner == caller) and customer.nextServiceDate > now
      }
    );
  };

  public query ({ caller }) func getWarrantyStatusCounts() : async {
    inWarranty : Nat;
    outWarranty : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view warranty status counts");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let customersArray = customersMap.values().toArray().filter(
      func(customer) { isAdmin or customer.owner == caller }
    );

    var inWarrantyCount = 0;
    var outWarrantyCount = 0;
    let now = Time.now();

    for (customer in customersArray.vals()) {
      switch (updateWarrantyStatus(customer, now).warrantyStatus) {
        case (#inWarranty) { inWarrantyCount += 1 };
        case (#outWarranty) { outWarrantyCount += 1 };
      };
    };
    { inWarranty = inWarrantyCount; outWarranty = outWarrantyCount };
  };

  public query ({ caller }) func getCustomersDueForServiceCurrentMonth() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers due for service");
    };
    let now = Time.now();
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let customersArray = customersMap.values().toArray().filter(
      func(customer) { isAdmin or customer.owner == caller }
    );

    let currentMonth = getYearMonth(now);

    let dueForService = customersArray.filter(
      func(customer) { getYearMonth(customer.nextServiceDate) == currentMonth }
    );

    dueForService;
  };

  public query ({ caller }) func getAllServices() : async [ServiceEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view services");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    servicesMap.values().toArray().filter<ServiceEntry>(
      func(entry) { isAdmin or entry.owner == caller }
    );
  };

  public query ({ caller }) func getAllReminders() : async [Reminder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reminders");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    remindersMap.values().toArray().filter<Reminder>(
      func(reminder) { isAdmin or reminder.owner == caller }
    );
  };

  public query ({ caller }) func getRevenueByMonth(year : Nat, month : Nat) : async RevenueByPeriod {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view revenue analytics");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let services = servicesMap.values().toArray().filter(
      func(entry) {
        (isAdmin or entry.owner == caller) and isInMonth(entry.serviceDate, year, month)
      }
    );

    calculateRevenue(services);
  };

  public query ({ caller }) func getRevenueByQuarter(year : Nat, quarter : Nat) : async RevenueByPeriod {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view revenue analytics");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let services = servicesMap.values().toArray().filter(
      func(entry) {
        (isAdmin or entry.owner == caller) and isInQuarter(entry.serviceDate, year, quarter)
      }
    );

    calculateRevenue(services);
  };

  public query ({ caller }) func getRevenueByYear(year : Nat) : async RevenueByPeriod {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view revenue analytics");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    let services = servicesMap.values().toArray().filter(
      func(entry) {
        (isAdmin or entry.owner == caller) and isInYear(entry.serviceDate, year)
      }
    );

    calculateRevenue(services);
  };

  public query ({ caller }) func getCustomerRevenueBreakdown() : async [CustomerRevenueBreakdown] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view revenue analytics");
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let now = Time.now();
    let oneYearAgo = now - (365 * 24 * 60 * 60 * 1_000_000_000);

    let customers = customersMap.values().toArray().filter(
      func(customer) { isAdmin or customer.owner == caller }
    );

    customers.map<Customer, CustomerRevenueBreakdown>(
      func(customer) {
        let customerServices = servicesMap.values().toArray().filter(
          func(entry) {
            entry.customerId == customer.id and entry.serviceDate >= oneYearAgo
          }
        );

        var paidCount = 0;
        var freeCount = 0;
        var totalRev = 0;

        for (service in customerServices.vals()) {
          if (service.isFree) {
            freeCount += 1;
          } else {
            paidCount += 1;
            totalRev += service.amount;
          };
        };

        let contractType = switch (customer.amcDetails) {
          case (?amc) { ?amc.contractType };
          case (null) { null };
        };

        {
          customerId = customer.id;
          customerName = customer.name;
          paidServicesCount = paidCount;
          freeServicesCount = freeCount;
          totalRevenue = totalRev;
          amcRenewalCount = if (customer.amcDetails != null) { 1 } else { 0 };
          contractType;
        };
      }
    );
  };

  func calculateNextServiceDate(installationDate : Time.Time, serviceInterval : Nat) : Time.Time {
    let monthsToNanos = 30 * 24 * 60 * 60 * 1_000_000_000;
    installationDate + (serviceInterval * monthsToNanos);
  };

  func updateWarrantyStatus(customer : Customer, now : Time.Time) : Customer {
    let warrantyPeriodNanos = 365 * 24 * 60 * 60 * 1_000_000_000;
    if (now > customer.installationDate + warrantyPeriodNanos) {
      { customer with warrantyStatus = #outWarranty };
    } else {
      { customer with warrantyStatus = #inWarranty };
    };
  };

  func validateServiceInterval(serviceInterval : Nat) {
    if (serviceInterval != 1 and serviceInterval != 3 and serviceInterval != 6) {
      Runtime.trap("Invalid service interval. Must be 1, 3, or 6 months.");
    };
  };

  func removeCustomerReminders(customerId : Nat) {
    let filteredReminders = remindersMap.filter(
      func(_id, reminder) { reminder.customerId != customerId }
    );
    remindersMap.clear();
    filteredReminders.toArray().forEach(
      func((key, value)) { remindersMap.add(key, value) }
    );
  };

  func removeCustomerServices(customerId : Nat) {
    let filteredServices = servicesMap.filter(
      func(_id, serviceEntry) { serviceEntry.customerId != customerId }
    );
    servicesMap.clear();
    filteredServices.toArray().forEach(
      func((key, value)) { servicesMap.add(key, value) }
    );
  };

  func isInvalidRecord(data : ImportCustomerData) : Bool {
    data.serviceInterval != 1 and data.serviceInterval != 3 and data.serviceInterval != 6 or
    data.installationDate <= 0 or
    data.name.size() == 0 or data.contact.size() == 0
  };

  func getErrorMessage(data : ImportCustomerData, row : Nat) : Text {
    if (data.serviceInterval != 1 and data.serviceInterval != 3 and data.serviceInterval != 6) {
      "Invalid service interval for " # data.name # ". Must be 1, 3, or 6 months.";
    } else if (data.installationDate <= 0) {
      "Invalid installation date for " # data.name # ". Date must be a valid nanoseconds timestamp.";
    } else {
      "Name and contact must not be empty for customer at row " # row.toText();
    };
  };

  func addCustomerRecord(data : ImportCustomerData, caller : Principal) {
    let brand = if (data.brand.size() == 0) { "Unknown" } else { data.brand };
    let model = if (data.model.size() == 0) { "Unknown" } else { data.model };
    let nextServiceDate = calculateNextServiceDate(data.installationDate, data.serviceInterval);
    let customerId = nextCustomerId;
    let reminderId = nextReminderId;

    let normalizedContact = normalizeIndianPhoneNumber(data.contact);

    let customer : Customer = {
      id = customerId;
      owner = caller;
      name = data.name;
      contact = normalizedContact;
      serviceType = data.serviceType;
      installationDate = data.installationDate;
      nextServiceDate;
      warrantyStatus = #inWarranty;
      serviceInterval = data.serviceInterval;
      brand;
      model;
      amcDetails = null;
      amcServices = [];
      amcContracts = [];
    };

    customersMap.add(customerId, customer);

    let reminder : Reminder = {
      id = reminderId;
      owner = caller;
      customerId = customerId;
      reminderDate = nextServiceDate;
      description = "Next service for " # data.name;
      sentStatus = false;
    };
    remindersMap.add(reminderId, reminder);

    nextCustomerId += 1;
    nextReminderId += 1;
  };

  func getYearMonth(time : Time.Time) : (Nat, Nat) {
    let nanosPerDay = 24 * 60 * 60 * 1_000_000_000;
    let daysSinceEpoch = time / nanosPerDay;
    let year = 1970 + daysSinceEpoch / 365;
    let month = 1 + ((daysSinceEpoch % 365) / 30);

    func intToNat(value : Int) : Nat {
      if (value < 0) { 0 } else { value.toNat() };
    };

    let yearNat = intToNat(year);
    let monthNat = intToNat(month);

    (yearNat, monthNat);
  };

  func isInMonth(time : Time.Time, year : Nat, month : Nat) : Bool {
    let (serviceYear, serviceMonth) = getYearMonth(time);
    serviceYear == year and serviceMonth == month;
  };

  func isInQuarter(time : Time.Time, year : Nat, quarter : Nat) : Bool {
    let (serviceYear, serviceMonth) = getYearMonth(time);
    if (serviceYear != year) { return false };

    let startMonth = ((quarter - 1) * 3) + 1;
    let endMonth = quarter * 3;
    serviceMonth >= startMonth and serviceMonth <= endMonth;
  };

  func isInYear(time : Time.Time, year : Nat) : Bool {
    let (serviceYear, _) = getYearMonth(time);
    serviceYear == year;
  };

  func calculateRevenue(services : [ServiceEntry]) : RevenueByPeriod {
    var totalRevenue = 0;
    var paidCount = 0;
    var freeCount = 0;

    for (service in services.vals()) {
      if (service.isFree) {
        freeCount += 1;
      } else {
        paidCount += 1;
        totalRevenue += service.amount;
      };
    };

    {
      totalRevenue;
      paidServicesCount = paidCount;
      freeServicesCount = freeCount;
    };
  };
};

