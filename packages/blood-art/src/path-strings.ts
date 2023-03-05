export const leftString = `M329.172,569.579L327.857,569.579C324.186,569.579 320.986,567.08 320.096,563.519C311.949,530.931 273.181,375.86 258.89,318.694C255.771,306.219 244.562,297.467 231.703,297.467L231.701,297.466C231.701,297.357 231.701,288.456 231.701,283.08C231.701,282.019 232.123,281.001 232.873,280.251C233.623,279.501 234.64,279.08 235.701,279.08C247.51,279.08 282.447,279.08 299.349,279.08C304.827,279.08 309.61,282.789 310.972,288.095C319.47,322.078 349.632,442.719 360.593,486.562L352.721,486.562L305.764,300L263.574,300L325.635,546.26L329.172,569.579Z`;
export const rightString = `M339.958,503.28L447.264,502.632C447.264,502.632 490.491,329.729 500.915,288.042C502.297,282.763 507.067,279.08 512.525,279.08C523.285,279.08 540.447,279.08 548.173,279.08C549.234,279.08 550.252,279.501 551.002,280.251C551.752,281.002 552.173,282.019 552.173,283.08C552.173,288.489 552.173,297.467 552.172,297.467C539.313,297.467 528.104,306.219 524.985,318.694C510.693,375.86 471.926,530.931 463.779,563.519C462.888,567.08 459.688,569.579 456.017,569.579L351.219,569.579L341.495,542.305L285.076,316.017L292.805,316.017L339.958,503.28Z`;

export const lChain =
	'311.083,288.538L360.593,486.562L352.721,486.562L305.764,300L263.574,300L325.635,546.26'
		.split('L')
		.map(s => s.split(',').map(n => Number.parseFloat(n)));
export const rChain =
	'500.792,288.538L447.264,502.632L339.958,503.28L292.805,316.017L285.076,316.017L341.495,542.305'
		.split('L')
		.map(s => s.split(',').map(n => Number.parseFloat(n)));
