import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
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

  type WarrantyStatus = { #inWarranty; #outWarranty };
  type PaymentStatus = { #paid; #unpaid; #free };
  type PaymentMethod = { #upi; #cash };
  type ServiceType = { #cleaning; #maintenance; #repair; #other : Text };

  type AMCDetails = {
    id : Nat;
    contractType : AMCType;
    durationYears : Nat;
    contractStartDate : Time.Time;
    contractEndDate : Time.Time;
    paymentMethod : PaymentMethod;
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

  type ContractStatus = { #active; #expired; #pendingRenewal };
  type AMCServiceEntry = {
    amcServiceId : Nat;
    customerServiceId : Nat;
    contractType : AMCType;
    serviceDate : Time.Time;
    contractStatus : ContractStatus;
    partsReplaced : Text;
    notes : Text;
    followUpNeeded : Bool;
    priceReduction : ?{
      partsName : Text;
      regularPrice : Text;
      discountPrice : Text;
    };
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

  type OldAMCDetails = {
    id : Nat;
    contractType : AMCType;
    durationYears : Nat;
    contractStartDate : Time.Time;
    contractEndDate : Time.Time;
    paymentMethod : AMCPaymentMethod; // Old type
    totalAmount : Nat;
    notes : Text;
    remainingBalance : Nat;
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
  };

  type AMCDuration = {
    startDate : Time.Time;
    endDate : Time.Time;
    contractType : AMCType;
    amount : Nat;
  };

  type OldCustomer = {
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
    amcDetails : ?OldAMCDetails;
    amcServices : [AMCServiceEntry];
    amcContracts : [AMCContract];
  };

  type OldActor = {
    nextCustomerId : Nat;
    nextServiceId : Nat;
    nextReminderId : Nat;
    nextAMCServiceId : Nat;
    customersMap : Map.Map<Nat, OldCustomer>;
    servicesMap : Map.Map<Nat, ServiceEntry>;
    remindersMap : Map.Map<Nat, Reminder>;
  };

  type NewActor = {
    nextCustomerId : Nat;
    nextServiceId : Nat;
    nextReminderId : Nat;
    nextAMCServiceId : Nat;
    customersMap : Map.Map<Nat, Customer>;
    servicesMap : Map.Map<Nat, ServiceEntry>;
    remindersMap : Map.Map<Nat, Reminder>;
  };

  func convertAMCPaymentMethod(oldPaymentMethod : AMCPaymentMethod) : PaymentMethod {
    switch (oldPaymentMethod) {
      case (#cash) { #cash };
      case (_) { #upi };
    };
  };

  func convertAMCDetails(oldAMCDetails : OldAMCDetails) : AMCDetails {
    {
      oldAMCDetails with
      paymentMethod = convertAMCPaymentMethod(oldAMCDetails.paymentMethod : AMCPaymentMethod)
    };
  };

  public func run(old : OldActor) : NewActor {
    let newCustomersMap = old.customersMap.map<Nat, OldCustomer, Customer>(
      func(_id, oldCustomer) {
        {
          oldCustomer with
          amcDetails = switch (oldCustomer.amcDetails) {
            case (null) { null };
            case (?oldAMCDetails) {
              ?convertAMCDetails(oldAMCDetails : OldAMCDetails);
            };
          };
        };
      }
    );
    {
      old with
      customersMap = newCustomersMap;
    };
  };
};
