import type { AMCType, ContractStatus } from '../backend';

export interface AMCTypeInfo {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export function getAMCTypeInfo(type: AMCType): AMCTypeInfo {
  switch (type) {
    case 'onlyService':
      return {
        label: 'Only Service',
        color: 'black',
        bgColor: 'bg-black',
        textColor: 'text-white',
      };
    case 'serviceWithParts':
      return {
        label: 'Service with Parts',
        color: 'gold',
        bgColor: 'bg-yellow-500',
        textColor: 'text-black',
      };
    case 'serviceWithParts50':
      return {
        label: 'Service with Parts @50%',
        color: 'silver',
        bgColor: 'bg-gray-400',
        textColor: 'text-black',
      };
    default:
      return {
        label: 'Unknown',
        color: 'gray',
        bgColor: 'bg-gray-500',
        textColor: 'text-white',
      };
  }
}

export function getContractStatusInfo(status: ContractStatus): { label: string; variant: 'default' | 'secondary' | 'destructive' } {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'default' };
    case 'expired':
      return { label: 'Expired', variant: 'destructive' };
    case 'pendingRenewal':
      return { label: 'Pending Renewal', variant: 'secondary' };
    default:
      return { label: 'Unknown', variant: 'secondary' };
  }
}
