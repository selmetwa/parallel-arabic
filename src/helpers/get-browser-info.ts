export const getBrowserInfo = (): boolean => {
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent;
    const isSafari = /Safari/.test(ua) && !/Chrome|Chromium/.test(ua);
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    return isSafari || isMobile
  } else {
    return false
  }
}