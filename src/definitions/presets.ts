export interface CraftPreset {
    id: string;
    name: string;
    description: string;
    demographics: {
        ageGroup: string;
        gender: string;
        ethnicity: string;
        occupation: string;
        education: string;
    };
    clinical: {
        diagnosis: string[];
        comorbidities: string[];
        familyHistory: string[];
        triggers: string[];
        emotionalState: string;
        predominantThoughts: string;
    };
    topic: string;
    notes: string;
    personaId: string;
}

export const CRAFT_PRESETS: CraftPreset[] = [
    {
        id: "young-anxious-female",
        name: "Young Anxious Female",
        description: "18-25 female with general and social anxiety, academic pressure",
        demographics: { ageGroup: "18-25", gender: "Female", ethnicity: "", occupation: "Student", education: "Some College" },
        clinical: { diagnosis: ["General Anxiety", "Social Anxiety"], comorbidities: ["Insomnia"], familyHistory: ["Anxiety"], triggers: ["Social Situations", "Work Stress"], emotionalState: "Anxious", predominantThoughts: "Everyone is judging me" },
        topic: "Managing overwhelming anxiety in social and academic settings",
        notes: "Recently started college, living away from home for the first time. Reports difficulty making friends and constant worry about academic performance.",
        personaId: "cbt"
    },
    {
        id: "young-male-ocd",
        name: "Young Male with OCD",
        description: "18-25 male with obsessive thoughts and compulsive rituals",
        demographics: { ageGroup: "18-25", gender: "Male", ethnicity: "", occupation: "Student", education: "Bachelor's Degree" },
        clinical: { diagnosis: ["OCD"], comorbidities: ["Anxiety"], familyHistory: ["Anxiety"], triggers: ["Uncertainty", "Health Concerns"], emotionalState: "Anxious", predominantThoughts: "Something bad is going to happen" },
        topic: "Reducing compulsive rituals and managing intrusive obsessive thoughts",
        notes: "Reports spending 2-3 hours daily on checking rituals. Has difficulty leaving the house without repeating routines. Symptoms worsening over the past 6 months.",
        personaId: "cbt"
    },
    {
        id: "young-depressed-male",
        name: "Young Depressed Male",
        description: "26-35 male with major depression and occupational stress",
        demographics: { ageGroup: "26-35", gender: "Male", ethnicity: "", occupation: "Professional (Corporate)", education: "Bachelor's Degree" },
        clinical: { diagnosis: ["Depression"], comorbidities: ["Insomnia"], familyHistory: ["Depression"], triggers: ["Work Stress", "Rejection/Failure"], emotionalState: "Depressed/Sad", predominantThoughts: "I am not good enough" },
        topic: "Addressing persistent low mood, lack of motivation, and feelings of inadequacy at work",
        notes: "Recently passed over for promotion. Has been isolating from friends and family. Reports poor sleep, low appetite, and loss of interest in hobbies.",
        personaId: "psychodynamic"
    },
    {
        id: "young-depressed-female",
        name: "Young Depressed Female",
        description: "26-35 female with depression and relationship difficulties",
        demographics: { ageGroup: "26-35", gender: "Female", ethnicity: "", occupation: "Healthcare Worker", education: "Master's Degree" },
        clinical: { diagnosis: ["Depression"], comorbidities: ["Anxiety"], familyHistory: ["Depression", "Anxiety"], triggers: ["Relationship Conflict", "Loneliness"], emotionalState: "Depressed/Sad", predominantThoughts: "I am a burden to others" },
        topic: "Managing depression exacerbated by a recent breakup and professional burnout",
        notes: "Works as a nurse in a high-stress ICU. Recent breakup after a 3-year relationship. Reports crying spells, social withdrawal, and difficulty finding joy in activities she once loved.",
        personaId: "empathetic"
    },
    {
        id: "postpartum-blues",
        name: "Post-Partum Blues",
        description: "New mother experiencing mild mood swings and adjustment difficulties",
        demographics: { ageGroup: "26-35", gender: "Female", ethnicity: "", occupation: "Stay-at-home Parent", education: "Bachelor's Degree" },
        clinical: { diagnosis: ["General Anxiety"], comorbidities: ["Insomnia"], familyHistory: ["Anxiety"], triggers: ["Health Concerns", "Uncertainty"], emotionalState: "Overwhlemed", predominantThoughts: "I can't handle this" },
        topic: "Coping with emotional volatility and overwhelm after childbirth",
        notes: "Gave birth 2 weeks ago. Reports frequent crying, irritability, difficulty sleeping even when baby sleeps. No thoughts of harm to self or baby. Supportive partner but feels guilty for not being 'happy enough'.",
        personaId: "empathetic"
    },
    {
        id: "postpartum-depression",
        name: "Post-Partum Depression",
        description: "New mother with persistent depressive symptoms after childbirth",
        demographics: { ageGroup: "26-35", gender: "Female", ethnicity: "", occupation: "Stay-at-home Parent", education: "Master's Degree" },
        clinical: { diagnosis: ["Depression"], comorbidities: ["Anxiety", "Insomnia"], familyHistory: ["Depression"], triggers: ["Health Concerns", "Loneliness", "Relationship Conflict"], emotionalState: "Numb/Empty", predominantThoughts: "I am not good enough" },
        topic: "Treating severe and persistent post-partum depression affecting bonding and daily functioning",
        notes: "Gave birth 4 months ago. Reports persistent sadness, lack of bonding with baby, extreme guilt, and intrusive thoughts about being a bad mother. Has stopped seeing friends. Husband reports concern about her withdrawn state.",
        personaId: "dbt"
    },
    {
        id: "midlife-burnout",
        name: "Midlife Career Burnout",
        description: "45+ professional with career burnout and existential concerns",
        demographics: { ageGroup: "46-55", gender: "Male", ethnicity: "", occupation: "Professional (Corporate)", education: "Master's Degree" },
        clinical: { diagnosis: ["Career Stress", "General Anxiety"], comorbidities: ["Hypertension", "Insomnia"], familyHistory: ["None known"], triggers: ["Work Stress", "Financial Problems"], emotionalState: "Angry/Irritable", predominantThoughts: "I have no future" },
        topic: "Navigating midlife career dissatisfaction, burnout, and questioning life direction",
        notes: "Senior executive with 20+ year career. Reports feeling trapped, angry, and disconnected from work. Drinking more than usual. Considering a drastic career change but fearful of financial instability.",
        personaId: "solution_focused"
    },
    {
        id: "ptsd-trauma-recovery",
        name: "PTSD / Trauma Recovery",
        description: "Adult with PTSD from past physical assault",
        demographics: { ageGroup: "36-45", gender: "Female", ethnicity: "", occupation: "Artist/Creative", education: "Bachelor's Degree" },
        clinical: { diagnosis: ["PTSD"], comorbidities: ["Depression", "Insomnia"], familyHistory: ["Alcoholism/Addiction"], triggers: ["Traumatic Memories", "Noise/Crowds", "Relationship Conflict"], emotionalState: "Fearful", predominantThoughts: "People cannot be trusted" },
        topic: "Processing trauma symptoms including hypervigilance, flashbacks, and avoidance behaviors",
        notes: "Physically assaulted 8 months ago. Reports frequent nightmares, startle response, avoidance of public spaces. Has not been able to return to her art studio. Relationship with partner strained due to irritability and need for control.",
        personaId: "act"
    },
    {
        id: "schizophrenia-first-episode",
        name: "First-Episode Schizophrenia",
        description: "18-25 male with emerging psychosis, paranoia, and delusional beliefs",
        demographics: { ageGroup: "18-25", gender: "Male", ethnicity: "", occupation: "Student", education: "Some College" },
        clinical: { diagnosis: ["Schizophrenia"], comorbidities: ["Anxiety", "Insomnia"], familyHistory: ["Schizophrenia"], triggers: ["Work Stress", "Social Situations", "Uncertainty"], emotionalState: "Fearful", predominantThoughts: "People cannot be trusted" },
        topic: "Managing emerging psychotic symptoms, reality testing, and medication adherence",
        notes: "Second-year university student who withdrew mid-semester. Reports hearing voices commenting on his behavior for the past 3 months. Believes classmates are plotting against him. Poor sleep and self-care. No prior psychiatric history. Family history of schizophrenia in maternal uncle.",
        personaId: "cbt"
    },
    {
        id: "bipolar-manic",
        name: "Bipolar I - Manic Episode",
        description: "26-35 male in acute manic phase with grandiosity and impulsivity",
        demographics: { ageGroup: "26-35", gender: "Male", ethnicity: "", occupation: "Artist/Creative", education: "Bachelor's Degree" },
        clinical: { diagnosis: ["Bipolar Disorder"], comorbidities: ["Insomnia"], familyHistory: ["Bipolar Disorder"], triggers: ["Work Stress", "Relationship Conflict"], emotionalState: "Angry/Irritable", predominantThoughts: "I must be perfect" },
        topic: "Stabilizing mood, reducing impulsive behavior, and restoring sleep during manic episode",
        notes: "Known bipolar I diagnosis, medication non-adherent for 2 months. Reports feeling 'amazing' with grandiose plans to start multiple businesses. Sleep decreased to 3 hours/night. Spending sprees, rapid speech, easily agitated when confronted. No current insight into illness.",
        personaId: "dbt"
    },
    {
        id: "anorexia-nervosa",
        name: "Anorexia Nervosa",
        description: "18-25 female with restrictive eating disorder and body dysmorphia",
        demographics: { ageGroup: "18-25", gender: "Female", ethnicity: "", occupation: "Student", education: "Some College" },
        clinical: { diagnosis: ["Eating Disorder", "Depression"], comorbidities: ["Anxiety", "Obesity"], familyHistory: ["Anxiety"], triggers: ["Social Situations", "Rejection/Failure", "Health Concerns"], emotionalState: "Guilty/Ashamed", predominantThoughts: "I am not good enough" },
        topic: "Addressing restrictive eating patterns, fear of weight gain, and distorted body image",
        notes: "BMI of 16.5. Reports intense fear of gaining weight despite being significantly underweight. Exercises 2+ hours daily. Skips meals, hides food, weighs herself multiple times daily. Denies severity of condition. Parents report she has lost 25 lbs in 4 months. No purging behaviors.",
        personaId: "cbt"
    },
    {
        id: "borderline-personality",
        name: "Borderline Personality Disorder",
        description: "26-35 female with emotional dysregulation, identity disturbance, and unstable relationships",
        demographics: { ageGroup: "26-35", gender: "Female", ethnicity: "", occupation: "Service Industry", education: "High School or below" },
        clinical: { diagnosis: ["Borderline Personality Disorder", "Depression"], comorbidities: ["Substance Abuse"], familyHistory: ["Alcoholism/Addiction", "Suicide"], triggers: ["Relationship Conflict", "Rejection/Failure", "Loneliness"], emotionalState: "Angry/Irritable", predominantThoughts: "I am a burden to others" },
        topic: "Developing emotional regulation skills, reducing self-harm urges, and stabilizing relationships",
        notes: "History of multiple brief but intense relationships. Reports chronic emptiness, fear of abandonment, and recurrent self-harm (cutting) triggered by perceived rejection. Recently fired after conflict with supervisor. History of childhood emotional neglect. Reports using alcohol to cope with intense emotions.",
        personaId: "dbt"
    },
    {
        id: "alcohol-use-disorder",
        name: "Alcohol Use Disorder (Relapse Prevention)",
        description: "36-45 male in early recovery with relapse triggers and family strain",
        demographics: { ageGroup: "36-45", gender: "Male", ethnicity: "", occupation: "Manual Laborer", education: "High School or below" },
        clinical: { diagnosis: ["Substance Use Disorder", "Depression"], comorbidities: ["Insomnia", "Hypertension"], familyHistory: ["Alcoholism/Addiction"], triggers: ["Work Stress", "Relationship Conflict", "Financial Problems"], emotionalState: "Guilty/Ashamed", predominantThoughts: "It's all my fault" },
        topic: "Strengthening relapse prevention skills, managing cravings, and repairing family relationships",
        notes: "Currently 6 weeks sober after 15 years of heavy drinking. Attends AA sporadically. Reports intense cravings triggered by work stress and marital conflict. Wife has threatened divorce. Experiences guilt about past behavior while intoxicated (verbal abuse, missed work). Sleep disturbances and irritability.",
        personaId: "solution_focused"
    },
    {
        id: "grief-loss-spouse",
        name: "Grief / Loss of Spouse",
        description: "56-65 female navigating complicated grief after losing her husband",
        demographics: { ageGroup: "56-65", gender: "Female", ethnicity: "", occupation: "Retired", education: "Associate Degree" },
        clinical: { diagnosis: ["Grief/Loss", "Depression"], comorbidities: ["Insomnia", "Chronic Pain"], familyHistory: ["None known"], triggers: ["Loneliness", "Health Concerns", "Traumatic Memories"], emotionalState: "Numb/Empty", predominantThoughts: "I have no future" },
        topic: "Navigating complicated grief, re-establishing meaning, and rebuilding social connections",
        notes: "Husband died suddenly from cardiac arrest 8 months ago after 34 years of marriage. Reports inability to leave the house, has kept his belongings exactly as they were. Cries daily, has stopped seeing friends, lost 15 lbs. Says she feels 'like half of me is missing.' No suicidal ideation but states she 'wants to be with him.'",
        personaId: "empathetic"
    },
    {
        id: "combat-veteran-ptsd",
        name: "Combat Veteran PTSD",
        description: "36-45 male veteran with combat-related PTSD and reintegration difficulties",
        demographics: { ageGroup: "36-45", gender: "Male", ethnicity: "", occupation: "Manual Laborer", education: "Some College" },
        clinical: { diagnosis: ["PTSD"], comorbidities: ["Depression", "Insomnia"], familyHistory: ["Anxiety"], triggers: ["Traumatic Memories", "Noise/Crowds", "Relationship Conflict"], emotionalState: "Angry/Irritable", predominantThoughts: "People cannot be trusted" },
        topic: "Processing combat trauma, reducing hyperarousal and anger outbursts, and improving civilian reintegration",
        notes: "Former infantry with 2 combat deployments (Afghanistan). Honorably discharged 5 years ago. Reports daily hypervigilance, exaggerated startle response, and avoidance of crowded places (grocery stores, malls). Frequent nightmares about IED blasts. Two DUIs in the past year. Estranged from wife and children. Reports feeling 'like a monster' and that civilians 'don't understand.'",
        personaId: "act"
    }
];
