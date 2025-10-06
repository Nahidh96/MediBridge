import React, { createContext, useContext } from 'react';
import type { EnabledModule } from '../hooks/useModules';

const ModuleContext = createContext<EnabledModule[]>([]);

interface ModuleProviderProps {
  modules: EnabledModule[];
  children: React.ReactNode;
}

export const ModuleProvider: React.FC<ModuleProviderProps> = ({
  modules,
  children
}: ModuleProviderProps) => (
  <ModuleContext.Provider value={modules}>{children}</ModuleContext.Provider>
);

export const useModulesContext = () => useContext(ModuleContext);
