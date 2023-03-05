export function isSuperset<T>(set: ReadonlySet<T>, subset: ReadonlySet<T>) {
	for (const element of subset) {
		if (!set.has(element)) {
			return false;
		}
	}

	return true;
}

export function union<T>(setA: ReadonlySet<T>, setB: ReadonlySet<T>) {
	const wipUnion = new Set<T>(setA);
	for (const element of setB) {
		wipUnion.add(element);
	}

	return wipUnion;
}

export function intersection<T>(setA: ReadonlySet<T>, setB: ReadonlySet<T>) {
	const wipInter = new Set<T>();
	for (const element of setB) {
		if (setA.has(element)) {
			wipInter.add(element);
		}
	}

	return wipInter;
}

export function symmetricDifference<T>(
	setA: ReadonlySet<T>,
	setB: ReadonlySet<T>,
) {
	const wipDif = new Set<T>(setA);
	for (const element of setB) {
		if (wipDif.has(element)) {
			wipDif.delete(element);
		} else {
			wipDif.add(element);
		}
	}

	return wipDif;
}

export function difference<T>(setA: ReadonlySet<T>, setB: ReadonlySet<T>) {
	const wipDif = new Set<T>(setA);
	for (const element of setB) {
		wipDif.delete(element);
	}

	return wipDif;
}
