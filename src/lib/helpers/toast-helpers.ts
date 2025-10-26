import { toast } from 'svelte-sonner';
import { goto } from '$app/navigation';

// Global toast tracking for better cleanup
let currentVideoProcessingToastId: string | number | null = null;

/**
 * Toast helper for sentence generation
 */
export function showSentenceGenerationToast(dialect: string) {
  return toast.loading(`Generating some new ${getDialectDisplayName(dialect)} sentences...`, {
    description: dialect === 'egyptian-arabic' || dialect === 'darija' 
      ? 'This usually takes up to 1 minute' 
      : 'This usually takes up to 1 minute',
    duration: Infinity // Never auto-close
  });
}

/**
 * Toast helper for successful sentence generation
 */
export function showSentenceSuccessToast(toastId: string | number, count: number, dialect: string) {
  toast.dismiss(toastId);

  // Add small delay to avoid race condition
  setTimeout(() => {
    toast.success(`Generated ${count} new sentences!`, {
      description: `${count} ${getDialectDisplayName(dialect)} sentences are ready to practice`,
      action: {
        label: 'Start Practicing',
        onClick: () => {
          goto('/sentences');
        }
      },
      duration: Infinity // Requires manual dismissal
    });
  }, 100);
}

/**
 * Toast helper for successful sentence generation for speak page
 */
export function showSpeakSentenceSuccessToast(toastId: string | number, count: number, dialect: string) {
  console.log('🔧 [toast-helpers] showSpeakSentenceSuccessToast called:', {
    toastId,
    count,
    dialect
  });
  
  console.log('🔧 [toast-helpers] Dismissing loading toast:', toastId);
  toast.dismiss(toastId);

  // Add small delay to avoid race condition
  setTimeout(() => {
    console.log('🔧 [toast-helpers] Creating speak success toast after delay...');
    const successToastId = toast.success(`Generated ${count} new sentences!`, {
      description: `${count} ${getDialectDisplayName(dialect)} sentences are ready for speaking practice`,
      action: {
        label: 'Start Speaking',
        onClick: () => {
          console.log('🔗 [toast-helpers] Navigating to speak page');
          goto('/speak');
        }
      },
      duration: Infinity // Requires manual dismissal
    });
    
    console.log('✅ [toast-helpers] Speak success toast created with ID:', successToastId);
  }, 100);
}

/**
 * Toast helper for sentence generation errors
 */
export function showSentenceErrorToast(toastId: string | number, error: string) {
  toast.error('Failed to generate sentences', {
    id: toastId,
    description: error,
    duration: Infinity // Requires manual dismissal
  });
}

/**
 * Toast helper for story creation
 */
export function showStoryCreationToast(dialect: string, storyType: string) {
  const toastId = toast.loading(`Creating your ${getDialectDisplayName(dialect)} ${storyType}...`, {
    description: dialect === 'darija' || dialect === 'egyptian-arabic' 
      ? 'This usually takes up to 2 minutes' 
      : 'This usually takes up to 2 minutes',
    duration: Infinity // Never auto-close
  });
  
  console.log('🔄 [toast-helpers] Created story loading toast:', { toastId, dialect, storyType });
  return toastId;
}

/**
 * Toast helper for successful story creation with navigation
 */
export function showStorySuccessToast(toastId: string | number, storyType: string, storyId: string) {
  console.log('🎉 [toast-helpers] Showing story success toast:', { toastId, storyType, storyId });
  
  // Dismiss the loading toast first
  toast.dismiss(toastId);
  
  // Show the success toast with action button
  const resultToastId = toast.success(`${storyType === 'story' ? 'Story' : 'Conversation'} created successfully!`, {
    description: 'Click the button below to view your new content',
    action: {
      label: `View ${storyType === 'story' ? 'Story' : 'Conversation'}`,
      onClick: () => {
        console.log('🔗 [toast-helpers] Navigating to story:', storyId);
        goto(`/generated_story/${storyId}`);
      }
    },
    duration: Infinity
  });
  console.log('✅ [toast-helpers] Success toast created:', resultToastId);
}

/**
 * Toast helper for audio transcription
 */
export function showTranscriptionToast() {
  const toastId = toast.loading('Transcribing audio and creating story...', {
    description: 'This may take up to 1 minute',
    duration: Infinity // Never auto-close
  });
  
  console.log('🔄 [toast-helpers] Created transcription loading toast:', { toastId });
  return toastId;
}

/**
 * Toast helper for successful transcription
 */
export function showTranscriptionSuccessToast(toastId: string | number, storyId: string) {
  console.log('🎉 [toast-helpers] Showing transcription success toast:', { toastId, storyId });
  
  // Dismiss the loading toast first
  toast.dismiss(toastId);
  
  // Show the success toast with action button
  const resultToastId = toast.success('Story created from audio!', {
    description: 'Your audio has been transcribed and formatted as an interactive story',
    action: {
      label: 'View Story',
      onClick: () => {
        console.log('🔗 [toast-helpers] Navigating to transcribed story:', storyId);
        goto(`/generated_story/${storyId}`);
      }
    },
    duration: Infinity
  });
  console.log('✅ [toast-helpers] Transcription success toast created:', resultToastId);
}

/**
 * Toast helper for general errors
 */
export function showErrorToast(toastId: string | number, message: string, description?: string) {
  toast.error(message, {
    id: toastId,
    description: description || 'An unexpected error occurred',
    duration: Infinity // Requires manual dismissal
  });
}

/**
 * Toast helper for video processing loading
 */
export function showVideoProcessingToast(videoSource: string) {
  console.log('🔧 [toast-helpers] Creating video processing loading toast for:', videoSource);
  console.log('🔍 [toast-helpers] toast object:', toast);
  console.log('🔍 [toast-helpers] toast.loading function:', typeof toast.loading);
  
  const toastId = toast.loading(`Processing ${videoSource} video...`, {
    description: 'Extracting transcript and creating interactive content',
    duration: Infinity
  });
  
  // Store globally for cleanup
  currentVideoProcessingToastId = toastId;
  console.log('🔧 [toast-helpers] Video processing loading toast created with ID:', toastId, typeof toastId);
  console.log('🔧 [toast-helpers] Stored globally as currentVideoProcessingToastId:', currentVideoProcessingToastId);
  console.log('🔍 [toast-helpers] Is toastId null?', toastId === null);
  console.log('🔍 [toast-helpers] Is toastId undefined?', toastId === undefined);
  
  return toastId;
}

/**
 * Toast helper for successful video processing
 */
export function showVideoProcessingSuccessToast(toastId: string | number, videoId: string, videoTitle?: string) {
  console.log('🔧 [toast-helpers] showVideoProcessingSuccessToast called:', { toastId, videoId, videoTitle });
  console.log('🔍 [toast-helpers] Current global toast ID:', currentVideoProcessingToastId);
  
  // Determine which toast ID to use for dismissal
  let dismissToastId: string | number | null = toastId;
  
  if (toastId === 'fallback-success') {
    console.log('🔄 [toast-helpers] Using fallback ID, trying global toast ID instead');
    if (currentVideoProcessingToastId) {
      dismissToastId = currentVideoProcessingToastId;
    } else {
      dismissToastId = null;
    }
  }
  
  console.log('🔍 [toast-helpers] Final dismiss toast ID:', dismissToastId, typeof dismissToastId);
  
  // Try to dismiss the loading toast
  if (dismissToastId) {
    console.log('🔍 [toast-helpers] Attempting to dismiss toast with ID:', dismissToastId);
    const dismissResult = toast.dismiss(dismissToastId);
    console.log('🔍 [toast-helpers] Toast dismiss result:', dismissResult);
  } else {
    console.log('🔄 [toast-helpers] No valid toast ID found, attempting to dismiss all toasts');
    try {
      toast.dismiss();
    } catch (e) {
      console.log('🔍 [toast-helpers] Error dismissing all toasts:', e);
    }
  }
  
  // Clear the global tracking after dismissal
  currentVideoProcessingToastId = null;
  
  setTimeout(() => {
    console.log('🔧 [toast-helpers] Creating video processing success toast after delay...');
    const successToastId = toast.success('Video processed successfully!', {
      description: videoTitle || 'Your video is ready to watch with interactive features',
      action: {
        label: 'Watch Video',
        onClick: () => {
          console.log('🔗 [toast-helpers] Navigating to video:', videoId);
          goto(`/video/${videoId}`);
        }
      },
      duration: Infinity
    });
    
    console.log('✅ [toast-helpers] Video processing success toast created:', successToastId);
  }, 100);
}

/**
 * Toast helper for video processing errors
 */
export function showVideoProcessingErrorToast(toastId: string | number, error: string) {
  console.log('🔧 [toast-helpers] showVideoProcessingErrorToast called:', { toastId, error });
  console.log('🔍 [toast-helpers] Current global toast ID:', currentVideoProcessingToastId);
  
  // Determine which toast ID to use for dismissal
  let dismissToastId: string | number | null = toastId;
  
  if (toastId === 'fallback-success' || !toastId) {
    console.log('🔄 [toast-helpers] Using fallback/invalid ID, trying global toast ID instead');
    if (currentVideoProcessingToastId) {
      dismissToastId = currentVideoProcessingToastId;
    } else {
      dismissToastId = null;
    }
  }
  
  console.log('🔍 [toast-helpers] Final dismiss toast ID for error:', dismissToastId, typeof dismissToastId);
  
  // Try to dismiss the loading toast
  if (dismissToastId) {
    console.log('🔍 [toast-helpers] Attempting to dismiss error toast with ID:', dismissToastId);
    const dismissResult = toast.dismiss(dismissToastId);
    console.log('🔍 [toast-helpers] Error toast dismiss result:', dismissResult);
  } else {
    console.log('🔄 [toast-helpers] No valid toast ID for error, attempting to dismiss all toasts');
    try {
      toast.dismiss();
    } catch (e) {
      console.log('🔍 [toast-helpers] Error dismissing all toasts:', e);
    }
  }
  
  // Clear the global tracking after dismissal
  currentVideoProcessingToastId = null;
  
  setTimeout(() => {
    console.log('🔧 [toast-helpers] Creating video processing error toast...');
    const errorToastId = toast.error('Failed to process video', {
      description: error || 'Could not process the video. Please try again.',
      duration: Infinity
    });
    console.log('❌ [toast-helpers] Video processing error toast created:', errorToastId);
  }, 100);
}

/**
 * Get display name for dialect
 */
function getDialectDisplayName(dialect: string): string {
  const dialectNames: Record<string, string> = {
    'egyptian-arabic': 'Egyptian Arabic',
    'darija': 'Moroccan Darija',
    'fusha': 'Modern Standard Arabic',
    'levantine': 'Levantine Arabic',
  };
  
  return dialectNames[dialect] || dialect;
}
