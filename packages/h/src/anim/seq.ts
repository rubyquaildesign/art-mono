export const seq = {
	_nextId: 0,
	nextId(): number {
		return seq._nextId++;
	},
};
export default seq;
