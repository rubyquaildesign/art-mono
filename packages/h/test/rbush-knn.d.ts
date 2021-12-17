import rb from 'rbush';
declare module 'rbush-knn' {
  function knn<T>(
    tree: rb<T>,
    x: number,
    y: number,
    k?: number,
    fn?: (item: T) => boolean,
    maxDist?: number,
  ): T[];
  export default knn;
}
