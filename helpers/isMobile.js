import MobileDetect from "mobile-detect";

export default () => {
  if (typeof  window != 'undefined') {
    const md = new MobileDetect(window.navigator.userAgent);
    return Boolean(md.mobile() || md.phone());
  }
  return false;
};
