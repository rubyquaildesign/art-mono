import { splineToBezier } from './bohm';
import { catmulToBezier, simplifySpline } from './catmull';
/**
 * Beziers spline returns a series of beziers representing a spline
 * @param loop spline to return
 * @param [degree] degree of the spline, defaults to 3
 * @param [close] whether the spline should be closed
 * @returns Bezier series
 */
export function bezierSpline(loop: Loop, degree = 3, close = false): Loop {
  if (degree === 3) {
    return splineToBezier(loop, close);
  }

  const cm = simplifySpline(loop, degree, close);
  return catmulToBezier(cm);
}
