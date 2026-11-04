import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

export default function UnsavedChangesGuard({ isDirty, message }) {
  const defaultMessage = message || 'You have unsaved changes. Are you sure you want to leave?';

  // 1. Block in-app React Router navigation
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmLeave = window.confirm(defaultMessage);
      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, defaultMessage]);

  // 2. Block browser tab close / reload
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = defaultMessage;
        return defaultMessage;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, defaultMessage]);

  return null;
}