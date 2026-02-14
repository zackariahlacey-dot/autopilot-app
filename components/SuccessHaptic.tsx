'use client';

import { useEffect } from 'react';
import { haptics } from '@/lib/haptics';

export default function SuccessHaptic({ isSuccess }: { isSuccess: boolean }) {
  useEffect(() => {
    if (isSuccess) {
      // Trigger success haptic feedback
      haptics.success();
    }
  }, [isSuccess]);

  return null;
}
