/**
 * 🛰️ NEURAL FITNESS KNOWLEDGE API (V1.0)
 * 🦾 ATHLETIC INTELLIGENCE LIBRARY
 * A comprehensive knowledge base of physical movement, biomechanics, and exercise theory
 * used by the AI to predict activities from video/vision data.
 */

export interface ExerciseTheory {
    id: string;
    name: string;
    category: 'Strength' | 'Yoga' | 'Static' | 'Cardio';
    description: string;
    keyMarkers: string[];
    typicalDurationSecs: number;
    cadence: 'slow' | 'medium' | 'fast';
    biomechanics: string;
}

export const FITNESS_KNOWLEDGE_BASE: Record<string, ExerciseTheory> = {
    squats: {
        id: 'squats',
        name: 'Weighted Squats',
        category: 'Strength',
        description: 'Lower body compound movement involving knee and hip flexion.',
        keyMarkers: ['Knee Flexion', 'Hip Crease', 'Spine Neutrality'],
        typicalDurationSecs: 30,
        cadence: 'medium',
        biomechanics: 'AI should look for vertical movement of the hips relative to stationary feet. Hip crease must descend toward or below knee level.'
    },
    yoga_tree: {
        id: 'yoga_tree',
        name: 'Yoga: Tree Pose',
        category: 'Yoga',
        description: 'Balance pose where one foot is placed on the inner thigh of the standing leg.',
        keyMarkers: ['Single Leg Balance', 'Ankle Adduction', 'Vertical Spine'],
        typicalDurationSecs: 60,
        cadence: 'slow',
        biomechanics: 'AI should detect one leg vertical (standing) while the other knee points laterally with the foot making contact with the standing leg.'
    },
    handstand: {
        id: 'handstand',
        name: 'Classical Handstand',
        category: 'Static',
        description: 'Full vertical inversion balancing on hands.',
        keyMarkers: ['Inversion', 'Shoulder Lock', 'Wrist Stability'],
        typicalDurationSecs: 15,
        cadence: 'slow',
        biomechanics: 'AI should detect feet and hips positioned vertically above the head and shoulders. Head pointing toward the ground.'
    },
    pushups: {
        id: 'pushups',
        name: 'Military Pushups',
        category: 'Strength',
        description: 'Upper body pushing movement in a plank position.',
        keyMarkers: ['Elbow Flexion', 'Plank Alignment', 'Scapular Stability'],
        typicalDurationSecs: 30,
        cadence: 'medium',
        biomechanics: 'AI should detect the chest moving toward the floor while the body remains in a straight line from heels to head.'
    },
    warrior_two: {
        id: 'yoga_warrior_2',
        name: 'Yoga: Warrior II',
        category: 'Yoga',
        description: 'Lunge-like stance with arms extended horizontally.',
        keyMarkers: ['Front Knee Flexion', 'Lateral Hip Opening', 'T-Bar Arms'],
        typicalDurationSecs: 45,
        cadence: 'slow',
        biomechanics: 'Detect wide leg stance, front knee @ 90 degrees, back leg straight, arms parallel to floor in line with legs.'
    }
};

/**
 * 🧠 Intelligence Query API
 * Returns the text-based theory for the AI to ingest.
 */
export function getFitnessIntelligenceString(): string {
    return Object.values(FITNESS_KNOWLEDGE_BASE)
        .map(ex => `
            EXERCISE: ${ex.name}
            CATEGORY: ${ex.category}
            BIOMECHANICS: ${ex.biomechanics}
            MARKERS: ${ex.keyMarkers.join(', ')}
        `).join('\n---\n');
}
