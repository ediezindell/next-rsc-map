import React from 'react';

// This component is intentionally not marked with 'use client'.
// It becomes a client component because it is imported by one.
export const Timestamp = () => {
  return <span>{new Date().toLocaleTimeString()}</span>;
};