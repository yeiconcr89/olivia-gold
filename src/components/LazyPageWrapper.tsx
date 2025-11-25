import React, { Suspense } from 'react';
import LoaderSpinner from './LoaderSpinner';
import { ErrorBoundary } from 'react-error-boundary';

interface LazyPageWrapperProps {
  children: React.ReactNode;
}

const LazyPageWrapper: React.FC<LazyPageWrapperProps> = ({ children }) => {
  return (
    <ErrorBoundary fallback={<div>Error al cargar la página</div>}>
      <Suspense fallback={<LoaderSpinner />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

export default LazyPageWrapper;