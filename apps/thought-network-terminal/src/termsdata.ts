type Node<T = string> = {
	id: T;
	text: string;
};

type Category<T = string> = {
	id: string;
	name: string;
	context: string;
	nodes: Node<T>[];
};
export type Link<T = string> = {
	id: string;
	nodes: [T, T];
	description: string;
};
type ExtractIDs<T> = T extends { categories: Category<infer D>[] } ? D : never;
const data = {
	categories: [
		{
			id: 'imaginedFeminineEmbodiment',
			name: 'Imagined Feminine Embodiment',
			context: 'Fantasizing about specific gendered bodily experiences',
			nodes: [
				{
					id: 'wonderfulMother',
					text: 'I would make a wonderful mother.',
					links: ['motherhood_longing', 'nurturing_care', 'maternal_soothing', 'mother_beloved'],
				},
				{
					id: 'bellySwellLove',
					text: 'I want to feel my belly swell with the love from another.',
					links: ['motherhood_longing', 'embodiment_barriers', 'beloved_beauty'],
				},
				{
					id: 'waterFlowing',
					text: 'Water flowing down my body the way it always should.',
					links: ['body_recognition', 'flowing_masking', 'natural_rightness'],
				},
				{
					id: 'objectOfAffection',
					text: 'Oh to be the object of affection.',
					links: ['desired_muse', 'validation_presence', 'beloved_beauty'],
				},
				{
					id: 'theMuseReason',
					text: 'Oh to be the muse, the reason for it all.',
					links: ['desired_muse', 'exceptional_performance', 'natural_rightness', 'words_fail_muse'],
				},
				{
					id: 'hadASister',
					text: 'I wish I had a sister so badly.',
					links: ['sisterhood_grief', 'sisterhood_adulthood', 'sister_mother'],
				},
				{
					id: 'seeYourBeauty',
					text: 'I see your beauty, in a body like mine, and through you I see my own.',
					links: ['body_recognition', 'reflection_comparison', 'natural_rightness', 'beloved_beauty'],
				},
				{
					id: 'couldntHoldYou',
					text: "I'm sorry he couldn't hold you like she should have.",
					links: ['sisterhood_grief', 'wound_to_care', 'holding_queer'],
				},
				{
					id: 'queerDoesntSayEnough',
					text: "Queer doesn't say enough, why can't it say enough?",
					links: ['language_inadequacy', 'dark_humor_identity', 'words_fail_muse', 'holding_queer'],
				},
			],
		},
		{
			id: 'transDysphoriaAndBarriers',
			name: 'Trans Dysphoria & Medical/Structural Barriers',
			context: 'The pain of transition obstacles, body/voice dysphoria',
			nodes: [
				{
					id: 'voiceAlwaysWrong',
					text: 'Why is the voice always wrong.',
					links: ['voice_body_betrayal', 'dysphoria_comparison'],
				},
				{
					id: 'comparingCisWomen',
					text: "I can't stop comparing myself to cis women, leaving me wanting.",
					links: ['reflection_comparison', 'dysphoria_comparison', 'comparison_smallness', 'wanting_surgery'],
				},
				{
					id: 'doctorCutMeOpen',
					text: "I still can't become a real woman unless I fly halfway around the world and pay a doctor to cut me open!\" It's not fair! IT'S NOT FAIR!",
					links: ['embodiment_barriers', 'medical_desperation', 'unfairness_survival', 'wanting_surgery'],
				},
				{
					id: 'waysToBeSmall',
					text: "I've ran out of ways to be small like the girl in my dreams.",
					links: ['voice_body_betrayal', 'comparison_smallness', 'effortless_embodiment'],
				},
				{
					id: 'microplasticsYChromosome',
					text: 'Maybe the microplastics will kill off the Y chromosome.',
					links: ['dark_humor_identity', 'body_contamination', 'dark_humor_desperation'],
				},
				{
					id: 'girlSoBadCouldDie',
					text: 'I want to be a girl so bad I could die.',
					links: ['medical_desperation', 'desperation_survival', 'dark_humor_desperation'],
				},
			],
		},
		{
			id: 'seekingValidation',
			name: 'Seeking Validation from Specific People',
			context: 'Wondering if particular individuals see/value you',
			nodes: [
				{
					id: 'kindWords',
					text: "Do they say kind worlds about me when I'm not around?",
					links: ['validation_presence', 'validation_boundaries', 'validation_performance'],
				},
				{
					id: 'codeGoodEnoughHim',
					text: 'Will my code ever be good enough for him?',
					links: ['exceptional_performance', 'validation_pairing', 'validation_performance'],
				},
				{
					id: 'ideasGoodEnoughHer',
					text: 'Will my ideas ever be good enough for her?',
					links: ['validation_pairing', 'deserve_acknowledgment'],
				},
				{
					id: 'selfishToExpect',
					text: 'Is it selfish to expect her to say something?',
					links: ['deserve_acknowledgment', 'hoping_disappointed'],
				},
				{
					id: 'gotMyHopesUp',
					text: 'You got my hopes up when you asked, I imagine you thought I had something to say that wanted to listen to',
					links: ['hoping_disappointed', 'hope_intensity'],
				},
			],
		},
		{
			id: 'sapphicDesire',
			name: 'Sapphic Desire & Romance',
			context: 'Sexual/romantic attraction to women',
			nodes: [
				{
					id: 'boughtADrink',
					text: "What's it take for a girl to get bought a drink in this economy?",
					links: ['casual_escalation', 'recognition_respect', 'desire_recognition'],
				},
				{
					id: 'fuckMeUp',
					text: 'I need this girl to fuck me up',
					links: ['casual_escalation', 'hope_intensity', 'intensity_boundaries', 'desire_recognition'],
				},
				{
					id: 'bakeACake',
					text: 'I want her to bake me a cake',
					links: ['nurturing_care', 'domestic_intimacy', 'desire_recognition'],
				},
				{
					id: 'iveGotYou',
					text: "It's ok, I've got you.",
					links: ['wound_to_care', 'care_expression', 'desire_recognition'],
				},
				{
					id: 'sootheYou',
					text: "I want to soothe you when you're overwhelmed.",
					links: ['maternal_soothing', 'domestic_intimacy', 'care_expression', 'tender_consent'],
				},
				{
					id: 'isThisOk',
					text: 'Is this ok?',
					links: ['consent_reassurance', 'touch_wrongness', 'tender_consent'],
				},
				{
					id: 'whyWouldntItBe',
					text: "Why wouldn't it be?",
					links: ['consent_reassurance', 'asserting_boundaries'],
				},
			],
		},
		{
			id: 'internalizedExpectations',
			name: 'Internalized Expectations & Dissociation',
			context: 'Internalized gendered expectations, discomfort with touch/body',
			nodes: [
				{
					id: 'naturalForGirls',
					text: 'This skill should be natural for girls, you should be enjoying this, you should be loving this.',
					links: ['effortless_embodiment', 'expectation_dissociation', 'natural_performance'],
				},
				{
					id: 'comfortableBeingTouched',
					text: 'What does it feel like to be comfortable being touched?',
					links: ['touch_wrongness', 'expectation_dissociation', 'natural_performance'],
				},
				{
					id: 'genderDoesntMatter',
					text: "We all become women, because gender doesn't matter.",
					links: ['language_inadequacy', 'ironic_survival', 'natural_performance'],
				},
			],
		},
		{
			id: 'survivalMaskingCare',
			name: 'Survival, Masking & Offering Care',
			context: 'Coping mechanisms, taking on adult roles, protecting others and self',
			nodes: [
				{
					id: 'settleForAlive',
					text: 'I wish that I got to be happy, but i will settle with getting to be alive.',
					links: ['desperation_survival', 'unfairness_survival', 'survival_responsibility', 'ironic_survival'],
				},
				{
					id: 'adultInRoom',
					text: 'At some point I became the adult in the room.',
					links: ['sisterhood_adulthood', 'survival_responsibility', 'premature_adulthood'],
				},
				{
					id: 'brightHair',
					text: "If your hair is bright enough, they won't notice the fear, the bitterness, the stagnancy.",
					links: ['flowing_masking', 'masking_suffocation', 'premature_adulthood', 'protection_masking'],
				},
				{
					id: 'dirtInLungs',
					text: 'The dirt fills my lungs like fibre glass.',
					links: ['body_contamination', 'masking_suffocation'],
				},
				{
					id: 'doNotTrainAI',
					text: 'Do not use my work to train AI.',
					links: [
						'validation_boundaries',
						'recognition_respect',
						'intensity_boundaries',
						'asserting_boundaries',
						'protection_masking',
					],
				},
			],
		},
	],
	links: [
		{
			id: 'motherhood_longing',
			nodes: ['wonderfulMother', 'bellySwellLove'],
			description: 'The longing for motherhood and the physical embodiment of nurturing life',
		},
		{
			id: 'body_recognition',
			nodes: ['waterFlowing', 'seeYourBeauty'],
			description: 'Finding the body you should have had reflected in others',
		},
		{
			id: 'desired_muse',
			nodes: ['objectOfAffection', 'theMuseReason'],
			description: 'The desire to be seen, desired, and to inspire',
		},
		{
			id: 'sisterhood_grief',
			nodes: ['hadASister', 'couldntHoldYou'],
			description: 'Grief for the sisterhood and feminine connection denied',
		},
		{
			id: 'natural_rightness',
			nodes: ['waterFlowing', 'theMuseReason', 'seeYourBeauty'],
			description: 'The sense that this embodied experience is how things should naturally be',
		},
		{
			id: 'words_fail_muse',
			nodes: ['queerDoesntSayEnough', 'theMuseReason'],
			description: "Language can't capture being the object of desire and inspiration",
		},
		{
			id: 'mother_beloved',
			nodes: ['wonderfulMother', 'objectOfAffection'],
			description: 'The desire to nurture and the desire to be cherished',
		},
		{
			id: 'beloved_beauty',
			nodes: ['bellySwellLove', 'objectOfAffection', 'seeYourBeauty'],
			description: 'Being loved, being desired, and seeing yourself as beautiful',
		},
		{
			id: 'sister_mother',
			nodes: ['hadASister', 'wonderfulMother'],
			description: 'Different forms of feminine kinship and care',
		},
		{
			id: 'holding_queer',
			nodes: ['couldntHoldYou', 'queerDoesntSayEnough'],
			description: 'The pain of not being held in your full queer identity',
		},
		{
			id: 'voice_body_betrayal',
			nodes: ['voiceAlwaysWrong', 'waysToBeSmall'],
			description: 'Body and voice betray the internal feminine self',
		},
		{
			id: 'dysphoria_comparison',
			nodes: ['voiceAlwaysWrong', 'comparingCisWomen'],
			description: 'Specific dysphoria feeding into broader patterns of comparison',
		},
		{
			id: 'comparison_smallness',
			nodes: ['comparingCisWomen', 'waysToBeSmall'],
			description: 'Comparing yourself while trying to shrink into femininity',
		},
		{
			id: 'medical_desperation',
			nodes: ['doctorCutMeOpen', 'girlSoBadCouldDie'],
			description: 'Medical barriers to transition and the desperation they create',
		},
		{
			id: 'dark_humor_desperation',
			nodes: ['microplasticsYChromosome', 'girlSoBadCouldDie'],
			description: 'Dark humor masking the intensity of dysphoric desperation',
		},
		{
			id: 'wanting_surgery',
			nodes: ['comparingCisWomen', 'doctorCutMeOpen'],
			description: 'The comparison leads to wanting medical transition that feels out of reach',
		},
		{
			id: 'validation_pairing',
			nodes: ['codeGoodEnoughHim', 'ideasGoodEnoughHer'],
			description: 'Seeking validation from multiple people who matter',
		},
		{
			id: 'deserve_acknowledgment',
			nodes: ['ideasGoodEnoughHer', 'selfishToExpect'],
			description: 'Wanting recognition but questioning if you deserve to ask for it',
		},
		{
			id: 'hoping_disappointed',
			nodes: ['selfishToExpect', 'gotMyHopesUp'],
			description: 'The pattern of hoping for acknowledgment and being disappointed',
		},
		{
			id: 'validation_performance',
			nodes: ['kindWords', 'codeGoodEnoughHim'],
			description: 'Performing excellence to earn recognition and kind words',
		},
		{
			id: 'casual_escalation',
			nodes: ['boughtADrink', 'fuckMeUp'],
			description: 'Casual desire escalating to overwhelming need',
		},
		{
			id: 'domestic_intimacy',
			nodes: ['bakeACake', 'sootheYou'],
			description: 'Acts of care and domestic intimacy',
		},
		{
			id: 'care_expression',
			nodes: ['iveGotYou', 'sootheYou'],
			description: 'Taking care of others as an expression of love',
		},
		{
			id: 'consent_reassurance',
			nodes: ['isThisOk', 'whyWouldntItBe'],
			description: 'Questioning consent and reassurance in intimacy',
		},
		{
			id: 'desire_recognition',
			nodes: ['boughtADrink', 'fuckMeUp', 'bakeACake', 'iveGotYou'],
			description: 'Different forms of wanting to be seen and desired by women',
		},
		{
			id: 'tender_consent',
			nodes: ['sootheYou', 'isThisOk'],
			description: 'Gentle care and checking in during intimate moments',
		},
		{
			id: 'expectation_dissociation',
			nodes: ['naturalForGirls', 'comfortableBeingTouched'],
			description: 'Internalized expectations clash with bodily dissociation',
		},
		{
			id: 'natural_performance',
			nodes: ['naturalForGirls', 'comfortableBeingTouched', 'genderDoesntMatter'],
			description: 'The pressure to perform gender naturally while feeling disconnected',
		},
		{
			id: 'survival_responsibility',
			nodes: ['settleForAlive', 'adultInRoom'],
			description: 'Survival and premature responsibility',
		},
		{
			id: 'masking_suffocation',
			nodes: ['brightHair', 'dirtInLungs'],
			description: 'Visible masking covering internal suffocation',
		},
		{
			id: 'premature_adulthood',
			nodes: ['adultInRoom', 'brightHair'],
			description: 'Forced maturity and the performance it requires',
		},
		{
			id: 'protection_masking',
			nodes: ['brightHair', 'doNotTrainAI'],
			description: 'Different forms of protecting yourself from being taken advantage of',
		},
		{
			id: 'ironic_survival',
			nodes: ['genderDoesntMatter', 'settleForAlive'],
			description: 'Ironic resignation about gender while fighting to survive',
		},
		{
			id: 'nurturing_care',
			nodes: ['wonderfulMother', 'bakeACake'],
			description: 'Nurturing through domestic acts of care and creation',
		},
		{
			id: 'maternal_soothing',
			nodes: ['wonderfulMother', 'sootheYou'],
			description: 'The desire to provide maternal comfort and care',
		},
		{
			id: 'embodiment_barriers',
			nodes: ['bellySwellLove', 'doctorCutMeOpen'],
			description: 'Desire for bodily transformation meets the violent reality of accessing it',
		},
		{
			id: 'flowing_masking',
			nodes: ['waterFlowing', 'brightHair'],
			description: 'External presentation as both authentic expression and protective mask',
		},
		{
			id: 'validation_presence',
			nodes: ['objectOfAffection', 'kindWords'],
			description: "Wondering if you're valued when you're not present to perform",
		},
		{
			id: 'exceptional_performance',
			nodes: ['theMuseReason', 'codeGoodEnoughHim'],
			description: 'The need to be exceptional, to be the reason someone pays attention',
		},
		{
			id: 'sisterhood_adulthood',
			nodes: ['hadASister', 'adultInRoom'],
			description: 'Mourning lost childhood and the sister relationship that never was',
		},
		{
			id: 'reflection_comparison',
			nodes: ['seeYourBeauty', 'comparingCisWomen'],
			description: 'Recognition and reflection becomes painful comparison',
		},
		{
			id: 'wound_to_care',
			nodes: ['couldntHoldYou', 'iveGotYou'],
			description: 'The wound of not being held transforms into the ability to hold others',
		},
		{
			id: 'language_inadequacy',
			nodes: ['queerDoesntSayEnough', 'genderDoesntMatter'],
			description: 'Language fails to capture the complexity of gender experience',
		},
		{
			id: 'dark_humor_identity',
			nodes: ['queerDoesntSayEnough', 'microplasticsYChromosome'],
			description: 'Dark humor about identity and the inadequacy of words',
		},
		{
			id: 'effortless_embodiment',
			nodes: ['waysToBeSmall', 'naturalForGirls'],
			description: 'Trying to embody femininity while being told it should be effortless',
		},
		{
			id: 'body_contamination',
			nodes: ['microplasticsYChromosome', 'dirtInLungs'],
			description: 'The body as site of environmental and existential contamination',
		},
		{
			id: 'desperation_survival',
			nodes: ['girlSoBadCouldDie', 'settleForAlive'],
			description: 'The intensity of gender dysphoria against the compromise of survival',
		},
		{
			id: 'unfairness_survival',
			nodes: ['doctorCutMeOpen', 'settleForAlive'],
			description: 'The unfairness of barriers to transition and the fight to stay alive',
		},
		{
			id: 'validation_boundaries',
			nodes: ['kindWords', 'doNotTrainAI'],
			description: "Concern about how you're perceived and how your work is used without consent",
		},
		{
			id: 'hope_intensity',
			nodes: ['gotMyHopesUp', 'fuckMeUp'],
			description: 'Emotional vulnerability and intensity of desire',
		},
		{
			id: 'recognition_respect',
			nodes: ['boughtADrink', 'doNotTrainAI'],
			description: 'Asking for basic recognition and respect in different contexts',
		},
		{
			id: 'intensity_boundaries',
			nodes: ['fuckMeUp', 'doNotTrainAI'],
			description: 'Intensity and boundaries - wanting to be affected while maintaining agency',
		},
		{
			id: 'touch_wrongness',
			nodes: ['isThisOk', 'comfortableBeingTouched'],
			description: 'Navigating touch and consent when your body feels wrong',
		},
		{
			id: 'asserting_boundaries',
			nodes: ['whyWouldntItBe', 'doNotTrainAI'],
			description: 'Asserting boundaries and the right to say no',
		},
	],
} as const;
export type ids = ExtractIDs<typeof data>;
