"use client";

import * as React from "react";

const TabsContext = React.createContext({ value: "", onValueChange: () => {} });

export function Tabs({ value, onValueChange, children, ...props }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, ...props }) {
  return (
    <div
      role="tablist"
      className="inline-flex h-10 items-center justify-center rounded-lg bg-gray-200 p-1"
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, ...props }) {
  const context = React.useContext(TabsContext);

  return (
    <button
      role="tab"
      onClick={() => context.onValueChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        context.value === value
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-600 hover:text-gray-900"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, ...props }) {
  const context = React.useContext(TabsContext);

  if (context.value !== value) return null;

  return (
    <div
      role="tabpanel"
      className="mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      {...props}
    >
      {children}
    </div>
  );
}
