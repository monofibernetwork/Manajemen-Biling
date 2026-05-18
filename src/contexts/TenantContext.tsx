import React, { createContext, useContext } from 'react';

export interface Branding {
  logoUrl?: string;
  businessName: string;
  primaryColorHex: string;
  domain?: string;
  packages?: any[];
}

export interface TenantContextType {
  tenantId: string;
  branding: Branding;
  setBranding: React.Dispatch<React.SetStateAction<Branding>>;
  adminRole: string;
}

export const defaultBranding: Branding = {
  businessName: 'Dream Paymanager',
  primaryColorHex: '#ea580c' // Default orange-600
};

export const TenantContext = createContext<TenantContextType>({
  tenantId: 'default',
  branding: defaultBranding,
  setBranding: () => {},
  adminRole: 'superadmin'
});

export const useTenant = () => useContext(TenantContext);
