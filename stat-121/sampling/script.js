// Sampling Methods Visualizer
// Interactive canvas-based tool for demonstrating sampling techniques

// ============================================================================
// SCENARIOS DATA
// ============================================================================

const SCENARIOS = [
    {
        name: "BYU Campus Survey",
        description: "Survey students about study habits",
        metric: "Hours studied per week",
        bestMethod: "stratified",
        spatialBias: true, // Convenience sampling will be very biased
        clusterNames: ["Helaman Halls", "Heritage Halls", "Wymount", "Off-Campus"], // Geographic clusters
        groups: [
            { name: "Freshmen", color: "#3b82f6", meanValue: 12, proportion: 0.40 }, // Larger group, low
            { name: "Sophomores", color: "#10b981", meanValue: 18, proportion: 0.25 },
            { name: "Juniors", color: "#f59e0b", meanValue: 24, proportion: 0.20 },
            { name: "Seniors", color: "#ef4444", meanValue: 32, proportion: 0.15 } // Smaller group, much higher
        ]
    },
    {
        name: "City Residents - Transit Support",
        description: "Poll residents on new transit line",
        metric: "Support rating (1-10)",
        bestMethod: "stratified",
        spatialBias: true, // Transit line location creates spatial bias
        clusterNames: ["Neighborhood 1", "Neighborhood 2", "Neighborhood 3", "Neighborhood 4"], // Geographic clusters
        groups: [
            { name: "North District", color: "#8b5cf6", meanValue: 9, proportion: 0.20 }, // Near transit, small
            { name: "South District", color: "#ec4899", meanValue: 2, proportion: 0.30 }, // Far from transit, large
            { name: "East District", color: "#14b8a6", meanValue: 9.5, proportion: 0.15 }, // Near transit, small
            { name: "West District", color: "#f97316", meanValue: 3, proportion: 0.35 }  // Far from transit, large
        ]
    },
    {
        name: "Hospital Patient Satisfaction",
        description: "Evaluate care quality across departments",
        metric: "Satisfaction score (1-10)",
        bestMethod: "cluster",
        spatialBias: false, // Clusters are well-mixed
        clusterNames: ["Floor 1", "Floor 2", "Floor 3", "Floor 4"], // Hospital floors as clusters
        groups: [
            { name: "Emergency", color: "#ef4444", meanValue: 6.8, proportion: 0.33 },
            { name: "Inpatient", color: "#3b82f6", meanValue: 7.2, proportion: 0.33 },
            { name: "Outpatient", color: "#10b981", meanValue: 7.0, proportion: 0.34 }
        ]
    },
    {
        name: "Mall Shoppers - Weekend vs Weekday",
        description: "Research shopping behavior patterns",
        metric: "Items purchased",
        bestMethod: "stratified",
        spatialBias: true, // Store entrance creates convenience bias
        clusterNames: ["North Wing", "South Wing", "East Wing", "West Wing"], // Mall sections as clusters
        groups: [
            { name: "Weekend Morning", color: "#a855f7", meanValue: 15, proportion: 0.10 }, // Small, high
            { name: "Weekend Afternoon", color: "#3b82f6", meanValue: 18, proportion: 0.30 }, // Big, highest
            { name: "Weekday Morning", color: "#f59e0b", meanValue: 3, proportion: 0.25 },
            { name: "Weekday Afternoon", color: "#10b981", meanValue: 6, proportion: 0.35 } // Largest, low
        ]
    },
    {
        name: "Office Workers - Homogeneous",
        description: "Study break room satisfaction",
        metric: "Satisfaction (1-10)",
        bestMethod: "simple-random",
        spatialBias: false, // All similar, location doesn't matter
        clusterNames: ["Building A", "Building B", "Building C", "Building D"], // Office buildings as clusters
        groups: [
            { name: "Floor 1", color: "#6366f1", meanValue: 7.0, proportion: 0.25 },
            { name: "Floor 2", color: "#22c55e", meanValue: 7.1, proportion: 0.25 },
            { name: "Floor 3", color: "#eab308", meanValue: 6.9, proportion: 0.25 },
            { name: "Floor 4", color: "#06b6d4", meanValue: 7.0, proportion: 0.25 }
        ]
    }
];

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let state = {
    scenario: null,
    currentMethod: 'simple-random',
    population: [],
    selectedSamples: [],
    isAnimating: false,
    canvas: null,
    ctx: null,
    populationSize: 100,
    sampleSize: 20,
    populationCircle: { x: 0, y: 0, radius: 0 },
    sampleCircle: { x: 0, y: 0, radius: 0 },
    researcherLocation: null, // For convenience sampling visualization
    populationMean: 0, // Population parameter
    sampleMean: 0, // Sample statistic
    simulationResults: [], // Store results from multiple simulation runs
    isRunningSimulation: false,
    currentScenarioIndex: 0 // Track current scenario
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeCanvas();
    populateScenarioDropdown();
    selectScenario(0); // Start with first scenario
    setupEventListeners();
    drawPopulation();
    updateLegend();
    
    // Set initial input values
    document.getElementById('population-size').value = state.populationSize;
    document.getElementById('sample-size').value = state.sampleSize;
});

function initializeCanvas() {
    state.canvas = document.getElementById('visualization-canvas');
    state.ctx = state.canvas.getContext('2d');
    
    // Set canvas size
    const container = state.canvas.parentElement;
    const size = Math.min(container.clientWidth - 48, 600);
    state.canvas.width = size;
    state.canvas.height = size;
    
    // Define population and sample circle areas
    // Population circle is 2x larger than sample circle
    const padding = 60;
    const totalWidth = size - (padding * 2);
    const sampleRadius = totalWidth / 6;
    const populationRadius = sampleRadius * 2;
    
    state.populationCircle = {
        x: padding + populationRadius,
        y: size / 2,
        radius: populationRadius
    };
    
    state.sampleCircle = {
        x: size - padding - sampleRadius,
        y: size / 2,
        radius: sampleRadius
    };
}

function selectScenario(index) {
    if (index < 0 || index >= SCENARIOS.length) {
        index = 0;
    }
    
    state.currentScenarioIndex = index;
    state.scenario = SCENARIOS[index];
    
    // Update UI
    document.getElementById('scenario-title').textContent = 
        `Scenario: ${state.scenario.name} - ${state.scenario.description}`;
    
    // Update dropdown selection
    const dropdown = document.getElementById('scenario-select');
    if (dropdown) {
        dropdown.value = index;
    }
    
    // Update hint based on best method
    updateScenarioHint();
    
    // Generate population
    generatePopulation();
}

function populateScenarioDropdown() {
    const dropdown = document.getElementById('scenario-select');
    if (!dropdown) return;
    
    dropdown.innerHTML = '';
    
    SCENARIOS.forEach((scenario, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = scenario.name;
        dropdown.appendChild(option);
    });
}

function updateScenarioHint() {
    const hintText = document.getElementById('hint-text');
    if (!hintText) return;
    
    const hints = {
        'stratified': 'This population has unequal group sizes with different values. Stratified sampling ensures all groups are represented proportionally.',
        'cluster': 'This population\'s clusters are internally diverse with similar means. Cluster sampling works well here.',
        'simple-random': 'This population is relatively homogeneous. Simple random sampling should work well.'
    };
    
    hintText.textContent = hints[state.scenario.bestMethod] || 
        'Try different sampling methods to see which produces the best estimate!';
}

function generatePopulation() {
    state.population = [];
    const popCircle = state.populationCircle;
    
    // Distribute population based on current method for better visualization
    if (state.currentMethod === 'cluster' || state.currentMethod === 'multistage') {
        generateClusteredPopulation();
    } else {
        generateRandomPopulation();
    }
}

function generateRandomPopulation() {
    const popCircle = state.populationCircle;
    
    // Ensure we have valid population size
    if (state.populationSize < 1) {
        state.populationSize = 100;
    }
    
    // Ensure sample size doesn't exceed population
    if (state.sampleSize > state.populationSize) {
        state.sampleSize = Math.floor(state.populationSize * 0.2);
    }
    
    // Generate based on group proportions
    let currentId = 0;
    state.scenario.groups.forEach(group => {
        const count = Math.round(state.populationSize * group.proportion);
        
        for (let i = 0; i < count && currentId < state.populationSize; i++) {
            // Generate random point within population circle
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.sqrt(Math.random()) * (popCircle.radius - 20);
            
            let x = popCircle.x + Math.cos(angle) * distance;
            let y = popCircle.y + Math.sin(angle) * distance;
            
            // If spatial bias is enabled, create geographic clustering by value
            if (state.scenario.spatialBias) {
                // High-value groups cluster toward one side, low-value toward another
                const valueBias = (group.meanValue - 5) / 10; // Normalize around midpoint
                const biasAngle = valueBias * Math.PI; // Positive = right, negative = left
                const biasStrength = 0.3; // How much to bias location
                
                x = popCircle.x + Math.cos(angle + biasAngle) * distance * (1 - biasStrength) 
                    + Math.cos(biasAngle) * popCircle.radius * biasStrength;
                y = popCircle.y + Math.sin(angle + biasAngle) * distance * (1 - biasStrength)
                    + Math.sin(biasAngle) * popCircle.radius * biasStrength;
            }
            
            // Generate value based on group mean with some random variation
            const value = group.meanValue + (Math.random() - 0.5) * (group.meanValue * 0.3);
            
            state.population.push({
                id: currentId++,
                x: x,
                y: y,
                originalX: x,
                originalY: y,
                targetX: x,
                targetY: y,
                group: group.name,
                color: group.color,
                selected: false,
                cluster: null,
                value: value
            });
        }
    });
    
    // Calculate population mean
    calculatePopulationMean();
}

function generateClusteredPopulation() {
    const numClusters = state.scenario.clusterNames ? state.scenario.clusterNames.length : 4;
    const popCircle = state.populationCircle;
    
    // Ensure we have valid population size
    if (state.populationSize < 1) {
        state.populationSize = 100;
    }
    
    // Ensure sample size doesn't exceed population
    if (state.sampleSize > state.populationSize) {
        state.sampleSize = Math.floor(state.populationSize * 0.2);
    }
    
    // Create cluster centers within population circle
    const clusterCenters = [];
    for (let i = 0; i < numClusters; i++) {
        const angle = (Math.PI * 2 / numClusters) * i;
        const distance = popCircle.radius * 0.5;
        clusterCenters.push({
            x: popCircle.x + Math.cos(angle) * distance,
            y: popCircle.y + Math.sin(angle) * distance,
            name: state.scenario.clusterNames ? state.scenario.clusterNames[i] : `Cluster ${i + 1}`
        });
    }
    
    // Generate population based on group proportions, distributed across clusters
    // Each cluster should have a mix of all groups (heterogeneous clusters)
    let currentId = 0;
    state.scenario.groups.forEach(group => {
        const count = Math.round(state.populationSize * group.proportion);
        
        for (let i = 0; i < count && currentId < state.populationSize; i++) {
            // Assign to cluster (spread groups evenly across clusters for heterogeneity)
            const clusterIndex = currentId % numClusters;
            const center = clusterCenters[clusterIndex];
            
            // Add some randomness around cluster center
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 40;
            
            const x = center.x + Math.cos(angle) * distance;
            const y = center.y + Math.sin(angle) * distance;
            
            // Generate value based on group mean with some random variation
            const value = group.meanValue + (Math.random() - 0.5) * (group.meanValue * 0.3);
            
            state.population.push({
                id: currentId++,
                x: x,
                y: y,
                originalX: x,
                originalY: y,
                targetX: x,
                targetY: y,
                group: group.name,
                color: group.color,
                selected: false,
                cluster: clusterIndex,
                clusterName: center.name,
                value: value
            });
        }
    });
    
    // Calculate population mean
    calculatePopulationMean();
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    // Theme toggle
    const themeSwitch = document.getElementById('theme-switch');
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeSwitch.checked = true;
    }
    themeSwitch.addEventListener('change', handleThemeChange);
    
    // Scenario selector
    document.getElementById('scenario-select').addEventListener('change', handleScenarioChange);
    
    // Sample button
    document.getElementById('sample-btn').addEventListener('click', handleSample);
    
    // Reset button
    document.getElementById('reset-btn').addEventListener('click', handleReset);
    
    // Apply settings button
    document.getElementById('apply-settings-btn').addEventListener('click', handleApplySettings);
    
    // Run simulation button
    document.getElementById('run-simulation-btn').addEventListener('click', handleRunSimulation);
    
    // View data button
    document.getElementById('view-data-btn').addEventListener('click', handleViewData);
    
    // Close data modal
    document.getElementById('close-data-btn').addEventListener('click', handleCloseData);
    
    // Export CSV button
    document.getElementById('export-csv-btn').addEventListener('click', handleExportCSV);
    
    // Close modal when clicking outside
    document.getElementById('data-modal').addEventListener('click', (e) => {
        if (e.target.id === 'data-modal') {
            handleCloseData();
        }
    });
    
    // Method tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => handleMethodChange(btn.dataset.method));
    });
    
    // Window resize
    window.addEventListener('resize', debounce(handleResize, 250));
}

function handleThemeChange() {
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
    drawPopulation(); // Redraw with new theme
}

function handleNewScenario() {
    if (state.isAnimating) return;
    selectRandomScenario();
    handleReset();
    updateLegend();
}

function handleScenarioChange(event) {
    if (state.isAnimating || state.isRunningSimulation) return;
    
    const selectedIndex = parseInt(event.target.value);
    selectScenario(selectedIndex);
    handleReset();
    updateLegend();
    
    // Hide simulation results when changing scenarios
    const resultsDiv = document.getElementById('simulation-results');
    if (resultsDiv) {
        resultsDiv.style.display = 'none';
    }
}

function handleSample() {
    if (state.isAnimating) return;
    
    state.isAnimating = true;
    document.getElementById('sample-btn').disabled = true;
    
    // Clear previous selection
    state.selectedSamples = [];
    state.population.forEach(p => p.selected = false);
    
    // Perform sampling based on method
    switch (state.currentMethod) {
        case 'simple-random':
            animateSimpleRandomSampling();
            break;
        case 'stratified':
            animateStratifiedSampling();
            break;
        case 'cluster':
            animateClusterSampling();
            break;
        case 'multistage':
            animateMultistageSampling();
            break;
        case 'convenience':
            animateConvenienceSampling();
            break;
        case 'quota':
            animateQuotaSampling();
            break;
    }
}

function handleReset() {
    if (state.isAnimating) return;
    
    state.selectedSamples = [];
    state.researcherLocation = null; // Clear researcher location
    state.sampleMean = 0;
    state.population.forEach(p => {
        p.selected = false;
        p.targetX = p.originalX;
        p.targetY = p.originalY;
    });
    
    // Animate back to original positions
    state.isAnimating = true;
    const startTime = Date.now();
    const animateBack = () => {
        drawPopulation();
        
        // Check if all dots are back to original position
        const allBack = state.population.every(p => 
            Math.abs(p.x - p.originalX) < 1 && Math.abs(p.y - p.originalY) < 1
        );
        
        if (allBack || Date.now() - startTime > 2000) {
            state.isAnimating = false;
            drawPopulation();
            updateStatisticsDisplay(); // Clear statistics display
        } else {
            requestAnimationFrame(animateBack);
        }
    };
    animateBack();
    
    updateSampleCount();
}

function handleMethodChange(method) {
    if (state.isAnimating) return;
    
    state.currentMethod = method;
    
    // Update tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.method === method);
        btn.setAttribute('aria-selected', btn.dataset.method === method);
    });
    
    // Update panels
    document.querySelectorAll('.method-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `${method}-panel`);
    });
    
    // Regenerate population for cluster and multistage methods
    if (method === 'cluster' || method === 'multistage') {
        generatePopulation();
    } else if (state.population.length > 0 && state.population[0].cluster !== null) {
        generatePopulation();
    }
    
    handleReset();
}

function handleResize() {
    initializeCanvas();
    generatePopulation();
    drawPopulation();
}

function handleApplySettings() {
    if (state.isAnimating || state.isRunningSimulation) return;
    
    const popSize = parseInt(document.getElementById('population-size').value);
    const sampSize = parseInt(document.getElementById('sample-size').value);
    
    // Validate inputs
    if (popSize < 50 || popSize > 500) {
        alert('Population size must be between 50 and 500');
        return;
    }
    if (sampSize < 10 || sampSize > 100) {
        alert('Sample size must be between 10 and 100');
        return;
    }
    if (sampSize > popSize) {
        alert('Sample size cannot be larger than population size');
        return;
    }
    
    state.populationSize = popSize;
    state.sampleSize = sampSize;
    
    // Regenerate population with new size
    generatePopulation();
    handleReset();
}

async function handleRunSimulation() {
    if (state.isAnimating || state.isRunningSimulation) return;
    
    const numRuns = parseInt(document.getElementById('simulation-runs').value);
    
    if (numRuns < 10 || numRuns > 1000) {
        alert('Number of runs must be between 10 and 1000');
        return;
    }
    
    state.isRunningSimulation = true;
    state.simulationResults = [];
    
    // Show progress bar
    const progressDiv = document.getElementById('simulation-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const resultsDiv = document.getElementById('simulation-results');
    
    progressDiv.style.display = 'block';
    resultsDiv.style.display = 'none';
    
    // Disable buttons
    document.getElementById('run-simulation-btn').disabled = true;
    document.getElementById('sample-btn').disabled = true;
    
    // Run simulation
    for (let i = 0; i < numRuns; i++) {
        // Update progress
        const progress = ((i + 1) / numRuns) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `Running simulation: ${i + 1}/${numRuns}`;
        
        // Perform one sample
        const sampleMean = await performSilentSample();
        state.simulationResults.push(sampleMean);
        
        // Small delay to allow UI update (every 10 runs)
        if (i % 10 === 0) {
            await sleep(10);
        }
    }
    
    // Hide progress, show results
    progressDiv.style.display = 'none';
    resultsDiv.style.display = 'block';
    
    // Calculate and display statistics
    displaySimulationResults();
    
    // Draw histogram
    drawSimulationHistogram();
    
    // Re-enable buttons
    document.getElementById('run-simulation-btn').disabled = false;
    document.getElementById('sample-btn').disabled = false;
    state.isRunningSimulation = false;
}

async function performSilentSample() {
    // Perform a sample without animation and return the sample mean
    const tempSamples = [];
    
    switch (state.currentMethod) {
        case 'simple-random':
            tempSamples.push(...performSimpleRandomSample());
            break;
        case 'stratified':
            tempSamples.push(...performStratifiedSample());
            break;
        case 'cluster':
            tempSamples.push(...performClusterSample());
            break;
        case 'multistage':
            tempSamples.push(...performMultistageSample());
            break;
        case 'convenience':
            tempSamples.push(...performConvenienceSample());
            break;
        case 'quota':
            tempSamples.push(...performQuotaSample());
            break;
    }
    
    // Calculate mean of this sample
    const sum = tempSamples.reduce((acc, person) => acc + person.value, 0);
    return sum / tempSamples.length;
}

function performSimpleRandomSample() {
    const availableIndices = [...Array(state.population.length).keys()];
    const samples = [];
    
    for (let i = 0; i < state.sampleSize; i++) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        samples.push(state.population[availableIndices[randomIndex]]);
        availableIndices.splice(randomIndex, 1);
    }
    
    return samples;
}

function performStratifiedSample() {
    const strata = {};
    state.scenario.groups.forEach(group => {
        strata[group.name] = {
            people: state.population.filter(p => p.group === group.name),
            proportion: group.proportion
        };
    });
    
    const samples = [];
    
    // Use proportional allocation: sample from each stratum proportionally
    for (const [groupName, stratum] of Object.entries(strata)) {
        const people = stratum.people;
        const stratumSampleSize = Math.round(state.sampleSize * stratum.proportion);
        const availableIndices = people.map(p => state.population.indexOf(p));
        
        // Take random sample from this stratum
        for (let i = 0; i < Math.min(stratumSampleSize, availableIndices.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            samples.push(state.population[availableIndices[randomIndex]]);
            availableIndices.splice(randomIndex, 1);
        }
    }
    
    return samples.slice(0, state.sampleSize);
}

function performClusterSample() {
    const clusters = {};
    state.population.forEach(person => {
        if (person.cluster !== null) {
            if (!clusters[person.cluster]) {
                clusters[person.cluster] = [];
            }
            clusters[person.cluster].push(person);
        }
    });
    
    const clusterIds = Object.keys(clusters);
    
    // Calculate how many clusters to select to approximate sample size
    const avgClusterSize = state.populationSize / clusterIds.length;
    const numClustersToSelect = Math.max(1, Math.min(
        clusterIds.length,
        Math.ceil(state.sampleSize / avgClusterSize)
    ));
    
    const samples = [];
    const availableClusterIds = [...clusterIds];
    
    for (let i = 0; i < numClustersToSelect; i++) {
        const randomIndex = Math.floor(Math.random() * availableClusterIds.length);
        const clusterId = availableClusterIds[randomIndex];
        
        // Add cluster members up to sample size
        for (const person of clusters[clusterId]) {
            if (samples.length >= state.sampleSize) break;
            samples.push(person);
        }
        
        availableClusterIds.splice(randomIndex, 1);
        
        // Stop if we've reached sample size
        if (samples.length >= state.sampleSize) break;
    }
    
    return samples.slice(0, state.sampleSize); // Ensure exact sample size
}

function performMultistageSample() {
    const clusters = {};
    state.population.forEach(person => {
        if (person.cluster !== null) {
            if (!clusters[person.cluster]) {
                clusters[person.cluster] = [];
            }
            clusters[person.cluster].push(person);
        }
    });
    
    const clusterIds = Object.keys(clusters);
    
    // Stage 1: Select clusters (similar to cluster sampling)
    const avgClusterSize = state.populationSize / clusterIds.length;
    const numClustersToSelect = Math.max(1, Math.min(
        clusterIds.length,
        Math.ceil(state.sampleSize / (avgClusterSize * 0.5)) // Select more clusters for multistage
    ));
    
    const samples = [];
    const availableClusterIds = [...clusterIds];
    const selectedClusters = [];
    
    for (let i = 0; i < numClustersToSelect; i++) {
        const randomIndex = Math.floor(Math.random() * availableClusterIds.length);
        const clusterId = availableClusterIds[randomIndex];
        selectedClusters.push(clusterId);
        availableClusterIds.splice(randomIndex, 1);
    }
    
    // Stage 2: Sample within each selected cluster
    const samplesPerCluster = Math.ceil(state.sampleSize / selectedClusters.length);
    
    for (const clusterId of selectedClusters) {
        const clusterMembers = clusters[clusterId];
        const availableIndices = [...Array(clusterMembers.length).keys()];
        
        // Randomly sample within this cluster
        const clusterSampleSize = Math.min(samplesPerCluster, clusterMembers.length);
        for (let i = 0; i < clusterSampleSize && samples.length < state.sampleSize; i++) {
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            samples.push(clusterMembers[availableIndices[randomIndex]]);
            availableIndices.splice(randomIndex, 1);
        }
        
        if (samples.length >= state.sampleSize) break;
    }
    
    return samples.slice(0, state.sampleSize);
}

function performConvenienceSample() {
    let startPerson;
    
    // For scenarios with spatial bias, pick a starting point in a biased location
    if (state.scenario.spatialBias) {
        // Find people in a biased location (left side where low-value groups cluster)
        const biasedPeople = state.population.filter(p => 
            p.x < state.populationCircle.x - state.populationCircle.radius * 0.3
        );
        
        if (biasedPeople.length > 0) {
            const startIndex = Math.floor(Math.random() * biasedPeople.length);
            startPerson = biasedPeople[startIndex];
        } else {
            // Fallback if no one is in biased area
            const startIndex = Math.floor(Math.random() * state.population.length);
            startPerson = state.population[startIndex];
        }
    } else {
        // Random starting point for non-biased scenarios
        const startIndex = Math.floor(Math.random() * state.population.length);
        startPerson = state.population[startIndex];
    }
    
    const distances = state.population.map((person, index) => ({
        index,
        person,
        distance: Math.hypot(person.x - startPerson.x, person.y - startPerson.y)
    }));
    
    distances.sort((a, b) => a.distance - b.distance);
    
    return distances.slice(0, state.sampleSize).map(d => d.person);
}

function performQuotaSample() {
    const quotaPerGroup = Math.ceil(state.sampleSize / state.scenario.groups.length);
    const samples = [];
    
    for (const group of state.scenario.groups) {
        const groupMembers = state.population.filter(p => p.group === group.name);
        const quota = Math.min(quotaPerGroup, groupMembers.length);
        
        // Quota sampling uses convenience/judgment within each quota (biased, not random)
        // Simulate this by selecting from the "most convenient" members
        // Sort by proximity to a convenience point (researcher's preference/bias)
        const conveniencePoint = {
            x: state.populationCircle.x - state.populationCircle.radius * 0.4,
            y: state.populationCircle.y
        };
        
        groupMembers.sort((a, b) => {
            const distA = Math.hypot(a.x - conveniencePoint.x, a.y - conveniencePoint.y);
            const distB = Math.hypot(b.x - conveniencePoint.x, b.y - conveniencePoint.y);
            return distA - distB;
        });
        
        // Take the most convenient ones for this quota
        for (let i = 0; i < quota && samples.length < state.sampleSize; i++) {
            samples.push(groupMembers[i]);
        }
    }
    
    return samples;
}

function displaySimulationResults() {
    const results = state.simulationResults;
    
    // Calculate statistics
    const mean = results.reduce((a, b) => a + b, 0) / results.length;
    const variance = results.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / results.length;
    const stdError = Math.sqrt(variance);
    
    // 95% Confidence Interval
    const z = 1.96; // 95% CI
    const ciLower = mean - z * stdError;
    const ciUpper = mean + z * stdError;
    
    // Display
    document.getElementById('sim-mean').textContent = mean.toFixed(2);
    document.getElementById('sim-std').textContent = stdError.toFixed(2);
    document.getElementById('sim-ci').textContent = `[${ciLower.toFixed(2)}, ${ciUpper.toFixed(2)}]`;
    
    // Check if population mean is in CI
    const popMean = state.populationMean;
    const inCI = popMean >= ciLower && popMean <= ciUpper;
    
    const ciElement = document.getElementById('sim-ci');
    if (inCI) {
        ciElement.style.color = '#10b981'; // Green
        ciElement.title = `Population mean (${popMean.toFixed(2)}) is within the 95% CI`;
    } else {
        ciElement.style.color = '#ef4444'; // Red
        ciElement.title = `Population mean (${popMean.toFixed(2)}) is outside the 95% CI`;
    }
}

function drawSimulationHistogram() {
    const canvas = document.getElementById('simulation-histogram');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const containerWidth = canvas.parentElement.clientWidth;
    canvas.width = containerWidth - 48;
    canvas.height = 300;
    
    const results = state.simulationResults;
    const popMean = state.populationMean;
    
    // Calculate histogram bins
    const min = Math.min(...results);
    const max = Math.max(...results);
    const numBins = Math.min(30, Math.ceil(Math.sqrt(results.length)));
    const binWidth = (max - min) / numBins;
    
    const bins = Array(numBins).fill(0);
    results.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
        bins[binIndex]++;
    });
    
    const maxBinCount = Math.max(...bins);
    
    // Drawing parameters
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const barWidth = chartWidth / numBins;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw bars
    ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--secondary-color').trim();
    
    bins.forEach((count, i) => {
        const barHeight = (count / maxBinCount) * chartHeight;
        const x = padding + i * barWidth;
        const y = padding + chartHeight - barHeight;
        
        ctx.fillRect(x, y, barWidth - 2, barHeight);
    });
    
    // Draw population mean line
    const popMeanX = padding + ((popMean - min) / (max - min)) * chartWidth;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(popMeanX, padding);
    ctx.lineTo(popMeanX, padding + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw axes
    ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--border-color').trim();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();
    
    // Draw labels
    ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--text-dark').trim();
    ctx.font = '12px Poppins, sans-serif';
    ctx.textAlign = 'center';
    
    // X-axis labels
    ctx.fillText(min.toFixed(1), padding, canvas.height - 10);
    ctx.fillText(max.toFixed(1), padding + chartWidth, canvas.height - 10);
    ctx.fillText('Sample Mean', canvas.width / 2, canvas.height - 10);
    
    // Y-axis label
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Frequency', 0, 0);
    ctx.restore();
    
    // Legend
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('— Population Mean', canvas.width - 150, 20);
}

// ============================================================================
// DRAWING FUNCTIONS
// ============================================================================

function drawPopulation() {
    const ctx = state.ctx;
    const canvas = state.canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw population and sample circles
    drawCircleAreas();
    
    // Draw population (dots behind researcher)
    state.population.forEach(person => {
        drawPerson(person);
    });
    
    // Draw researcher location on top so it's always visible
    if (state.researcherLocation) {
        drawResearcher();
    }
}

function drawCircleAreas() {
    const ctx = state.ctx;
    
    // Draw population circle
    ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--border-color').trim();
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(state.populationCircle.x, state.populationCircle.y, state.populationCircle.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Label
    ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--text-light').trim();
    ctx.font = '14px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Population', state.populationCircle.x, state.populationCircle.y - state.populationCircle.radius - 10);
    
    // Draw sample circle
    ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--secondary-color').trim();
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(state.sampleCircle.x, state.sampleCircle.y, state.sampleCircle.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Label
    ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--text-dark').trim();
    ctx.fillText('Sample', state.sampleCircle.x, state.sampleCircle.y - state.sampleCircle.radius - 10);
    ctx.textAlign = 'left';
}

function drawResearcher() {
    const ctx = state.ctx;
    const loc = state.researcherLocation;
    
    if (!loc) return;
    
    // Draw expanding radius circles to show "convenience zone"
    const maxRadius = loc.maxRadius || 0;
    if (maxRadius > 0) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.lineWidth = 2;
        for (let r = 20; r <= maxRadius; r += 20) {
            ctx.beginPath();
            ctx.arc(loc.x, loc.y, r, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // Draw white circle background to make icon stand out
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(loc.x, loc.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw red border around researcher
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(loc.x, loc.y, 18, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw researcher icon (person symbol) - larger
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👤', loc.x, loc.y);
    
    // Reset
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

function drawClusterBoundaries() {
    const ctx = state.ctx;
    const clusters = {};
    
    // Group people by cluster
    state.population.forEach(person => {
        if (person.cluster !== null) {
            if (!clusters[person.cluster]) {
                clusters[person.cluster] = [];
            }
            clusters[person.cluster].push(person);
        }
    });
    
    // Draw boundary for each cluster
    Object.values(clusters).forEach(clusterPeople => {
        if (clusterPeople.length === 0) return;
        
        // Calculate bounding box
        const xs = clusterPeople.map(p => p.x);
        const ys = clusterPeople.map(p => p.y);
        const minX = Math.min(...xs) - 20;
        const maxX = Math.max(...xs) + 20;
        const minY = Math.min(...ys) - 20;
        const maxY = Math.max(...ys) + 20;
        
        // Draw rounded rectangle
        ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--border-color').trim();
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        ctx.setLineDash([]);
    });
}

function drawPerson(person) {
    const ctx = state.ctx;
    const radius = person.selected ? 8 : 6;
    
    // Animate movement towards target position
    const speed = 0.15;
    person.x += (person.targetX - person.x) * speed;
    person.y += (person.targetY - person.y) * speed;
    
    // Draw selection glow
    if (person.selected) {
        ctx.shadowColor = person.color;
        ctx.shadowBlur = 15;
    }
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(person.x, person.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = person.color;
    ctx.fill();
    
    // Draw border
    if (person.selected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

function updateLegend() {
    const legendItems = document.getElementById('legend-items');
    legendItems.innerHTML = '';
    
    state.scenario.groups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        
        const color = document.createElement('div');
        color.className = 'legend-color';
        color.style.backgroundColor = group.color;
        
        const label = document.createElement('span');
        label.className = 'legend-label';
        label.textContent = group.name;
        
        item.appendChild(color);
        item.appendChild(label);
        legendItems.appendChild(item);
    });
}

function updateSampleCount() {
    document.getElementById('sample-count').textContent = 
        `Sample size: ${state.selectedSamples.length}`;
}

function moveSampleToArea(person, index) {
    // Calculate position in sample circle
    const sampleCircle = state.sampleCircle;
    
    // Arrange in circular pattern within sample circle
    const maxRadius = sampleCircle.radius - 20;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * maxRadius;
    
    person.targetX = sampleCircle.x + Math.cos(angle) * distance;
    person.targetY = sampleCircle.y + Math.sin(angle) * distance;
}

function animationLoop() {
    if (state.isAnimating) {
        drawPopulation();
        requestAnimationFrame(animationLoop);
    }
}

function updateSampleCount() {
    document.getElementById('sample-count').textContent = 
        `Sample size: ${state.selectedSamples.length}`;
    
    // Calculate and display sample mean if we have samples
    if (state.selectedSamples.length > 0) {
        calculateSampleMean();
        updateStatisticsDisplay();
    }
}

function calculatePopulationMean() {
    const sum = state.population.reduce((acc, person) => acc + person.value, 0);
    state.populationMean = sum / state.population.length;
    updateStatisticsDisplay();
}

function calculateSampleMean() {
    if (state.selectedSamples.length === 0) {
        state.sampleMean = 0;
        return;
    }
    const sum = state.selectedSamples.reduce((acc, person) => acc + person.value, 0);
    state.sampleMean = sum / state.selectedSamples.length;
}

function updateStatisticsDisplay() {
    const popMeanEl = document.getElementById('population-mean');
    const sampleMeanEl = document.getElementById('sample-mean');
    const differenceEl = document.getElementById('difference');
    const metricEl = document.getElementById('metric-name');
    const statsPanel = document.querySelector('.statistics-panel');
    
    if (!popMeanEl) return; // Elements not yet created
    
    // Update metric name
    metricEl.textContent = state.scenario.metric;
    
    // Update population mean
    popMeanEl.textContent = state.populationMean.toFixed(2);
    
    // Update sample mean
    if (state.selectedSamples.length > 0) {
        sampleMeanEl.textContent = state.sampleMean.toFixed(2);
        const diff = state.sampleMean - state.populationMean;
        const diffPercent = ((diff / state.populationMean) * 100).toFixed(1);
        const absDiff = Math.abs(diff);
        const absPercent = Math.abs(parseFloat(diffPercent));
        
        // Determine bias level
        let biasLevel = '';
        let biasIcon = '';
        if (absPercent < 5) {
            biasLevel = 'excellent';
            biasIcon = '✓ Excellent estimate!';
            differenceEl.style.color = '#10b981'; // Green
            statsPanel.className = 'statistics-panel bias-excellent';
        } else if (absPercent < 15) {
            biasLevel = 'moderate';
            biasIcon = '⚠ Moderate bias';
            differenceEl.style.color = '#f59e0b'; // Orange
            statsPanel.className = 'statistics-panel bias-moderate';
        } else {
            biasLevel = 'high';
            biasIcon = '✗ High bias!';
            differenceEl.style.color = '#ef4444'; // Red
            statsPanel.className = 'statistics-panel bias-high';
        }
        
        differenceEl.innerHTML = `<span class="bias-icon">${biasIcon}</span><br>${diff >= 0 ? '+' : ''}${diff.toFixed(2)} (${diffPercent}%)`;
    } else {
        sampleMeanEl.textContent = '—';
        differenceEl.innerHTML = '—';
        differenceEl.style.color = '';
        statsPanel.className = 'statistics-panel';
    }
}

// ============================================================================
// SAMPLING ANIMATIONS
// ============================================================================

async function animateSimpleRandomSampling() {
    // Select random individuals
    const availableIndices = [...Array(state.population.length).keys()];
    const selectedIndices = [];
    
    for (let i = 0; i < state.sampleSize; i++) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        selectedIndices.push(availableIndices[randomIndex]);
        availableIndices.splice(randomIndex, 1);
    }
    
    // Start animation loop
    requestAnimationFrame(animationLoop);
    
    // Animate selection with delay
    for (let i = 0; i < selectedIndices.length; i++) {
        await sleep(300);
        const index = selectedIndices[i];
        state.population[index].selected = true;
        state.selectedSamples.push(state.population[index]);
        moveSampleToArea(state.population[index], i);
        updateSampleCount();
    }
    
    // Wait for animation to complete
    await sleep(2000);
    
    finishSampling();
}

async function animateStratifiedSampling() {
    // Step 1: Group by strata (visual arrangement)
    const strata = {};
    state.scenario.groups.forEach(group => {
        strata[group.name] = {
            people: state.population.filter(p => p.group === group.name),
            proportion: group.proportion
        };
    });
    
    // Start animation loop
    requestAnimationFrame(animationLoop);
    
    // Arrange population by strata temporarily for visual effect
    const numStrata = Object.keys(strata).length;
    const angleStep = (Math.PI * 2) / numStrata;
    let strataIndex = 0;
    
    for (const [groupName, stratum] of Object.entries(strata)) {
        const people = stratum.people;
        const angle = angleStep * strataIndex;
        const centerDistance = state.populationCircle.radius * 0.5;
        const centerX = state.populationCircle.x + Math.cos(angle) * centerDistance;
        const centerY = state.populationCircle.y + Math.sin(angle) * centerDistance;
        
        people.forEach((person, i) => {
            const subAngle = Math.random() * Math.PI * 2;
            const subDistance = Math.random() * 30;
            person.targetX = centerX + Math.cos(subAngle) * subDistance;
            person.targetY = centerY + Math.sin(subAngle) * subDistance;
        });
        
        strataIndex++;
    }
    
    // Wait for grouping animation
    await sleep(2000);
    
    let sampleIndex = 0;
    
    // Step 2: Sample from each stratum proportionally
    for (const [groupName, stratum] of Object.entries(strata)) {
        const people = stratum.people;
        const stratumSampleSize = Math.round(state.sampleSize * stratum.proportion);
        const availableIndices = people.map(p => state.population.indexOf(p));
        
        for (let i = 0; i < Math.min(stratumSampleSize, availableIndices.length); i++) {
            await sleep(300);
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            const personIndex = availableIndices[randomIndex];
            availableIndices.splice(randomIndex, 1);
            
            state.population[personIndex].selected = true;
            state.selectedSamples.push(state.population[personIndex]);
            moveSampleToArea(state.population[personIndex], sampleIndex);
            sampleIndex++;
            updateSampleCount();
        }
    }
    
    // Wait for animation to complete
    await sleep(2000);
    
    finishSampling();
}

async function animateClusterSampling() {
    // Get all clusters
    const clusters = {};
    state.population.forEach(person => {
        if (person.cluster !== null) {
            if (!clusters[person.cluster]) {
                clusters[person.cluster] = [];
            }
            clusters[person.cluster].push(person);
        }
    });
    
    // Start animation loop
    requestAnimationFrame(animationLoop);
    
    // Step 1: Visually highlight clusters by drawing boundaries
    await sleep(1500);
    
    const clusterIds = Object.keys(clusters);
    
    // Calculate how many clusters to select to approximate sample size
    // If we have 4 clusters and want 20 samples from 100 people, select ~1 cluster
    const avgClusterSize = state.populationSize / clusterIds.length;
    const numClustersToSelect = Math.max(1, Math.min(
        clusterIds.length,
        Math.ceil(state.sampleSize / avgClusterSize)
    ));
    
    // Randomly select clusters
    const selectedClusters = [];
    const availableClusterIds = [...clusterIds];
    for (let i = 0; i < numClustersToSelect; i++) {
        const randomIndex = Math.floor(Math.random() * availableClusterIds.length);
        selectedClusters.push(availableClusterIds[randomIndex]);
        availableClusterIds.splice(randomIndex, 1);
    }
    
    let sampleIndex = 0;
    
    // Step 2: Select all members of chosen clusters (up to sample size)
    for (const clusterId of selectedClusters) {
        const clusterMembers = clusters[clusterId];
        
        // Briefly highlight the entire cluster
        await sleep(500);
        
        for (const person of clusterMembers) {
            // Stop if we've reached sample size
            if (sampleIndex >= state.sampleSize) break;
            
            await sleep(100);
            person.selected = true;
            state.selectedSamples.push(person);
            moveSampleToArea(person, sampleIndex);
            sampleIndex++;
            updateSampleCount();
        }
        
        // Stop if we've reached sample size
        if (sampleIndex >= state.sampleSize) break;
        
        await sleep(500); // Pause between clusters
    }
    
    // Wait for animation to complete
    await sleep(2000);
    
    finishSampling();
}

async function animateMultistageSampling() {
    // Get all clusters
    const clusters = {};
    state.population.forEach(person => {
        if (person.cluster !== null) {
            if (!clusters[person.cluster]) {
                clusters[person.cluster] = [];
            }
            clusters[person.cluster].push(person);
        }
    });
    
    const clusterIds = Object.keys(clusters);
    
    // If no clusters found, regenerate population with clusters
    if (clusterIds.length === 0) {
        console.warn('No clusters found in population, regenerating...');
        generateClusteredPopulation();
        drawPopulation();
        // Rebuild clusters object
        state.population.forEach(person => {
            if (person.cluster !== null) {
                if (!clusters[person.cluster]) {
                    clusters[person.cluster] = [];
                }
                clusters[person.cluster].push(person);
            }
        });
    }
    
    // Start animation loop
    requestAnimationFrame(animationLoop);
    
    // Step 1: Visually highlight clusters
    await sleep(1500);
    
    // Calculate how many clusters to select (more than cluster sampling)
    const avgClusterSize = state.populationSize / clusterIds.length;
    const numClustersToSelect = Math.max(1, Math.min(
        clusterIds.length,
        Math.ceil(state.sampleSize / (avgClusterSize * 0.5))
    ));
    
    // Stage 1: Randomly select clusters
    const selectedClusters = [];
    const availableClusterIds = [...clusterIds];
    for (let i = 0; i < numClustersToSelect; i++) {
        const randomIndex = Math.floor(Math.random() * availableClusterIds.length);
        selectedClusters.push(availableClusterIds[randomIndex]);
        availableClusterIds.splice(randomIndex, 1);
    }
    
    let sampleIndex = 0;
    const samplesPerCluster = Math.ceil(state.sampleSize / selectedClusters.length);
    
    // Stage 2: Sample within each selected cluster
    for (const clusterId of selectedClusters) {
        const clusterMembers = clusters[clusterId];
        
        // Skip if cluster has no members (defensive check)
        if (!clusterMembers || clusterMembers.length === 0) {
            console.warn(`Cluster ${clusterId} has no members, skipping...`);
            continue;
        }
        
        // Briefly highlight the entire cluster
        await sleep(500);
        
        // Randomly sample from this cluster
        const availableIndices = [...Array(clusterMembers.length).keys()];
        const clusterSampleSize = Math.min(samplesPerCluster, clusterMembers.length);
        
        for (let i = 0; i < clusterSampleSize && sampleIndex < state.sampleSize; i++) {
            await sleep(200);
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            const person = clusterMembers[availableIndices[randomIndex]];
            availableIndices.splice(randomIndex, 1);
            
            person.selected = true;
            state.selectedSamples.push(person);
            moveSampleToArea(person, sampleIndex);
            sampleIndex++;
            updateSampleCount();
        }
        
        // Stop if we've reached sample size
        if (sampleIndex >= state.sampleSize) break;
        
        await sleep(500); // Pause between clusters
    }
    
    // Wait for animation to complete
    await sleep(2000);
    
    finishSampling();
}

async function animateConvenienceSampling() {
    let startPerson;
    
    // For scenarios with spatial bias, pick a starting point in a biased location
    if (state.scenario.spatialBias) {
        // Find people in a biased location (left side where low-value groups cluster)
        const biasedPeople = state.population.filter(p => 
            p.x < state.populationCircle.x - state.populationCircle.radius * 0.3
        );
        
        if (biasedPeople.length > 0) {
            const startIndex = Math.floor(Math.random() * biasedPeople.length);
            startPerson = biasedPeople[startIndex];
        } else {
            // Fallback if no one is in biased area
            const startIndex = Math.floor(Math.random() * state.population.length);
            startPerson = state.population[startIndex];
        }
    } else {
        // Random starting point for non-biased scenarios
        const startIndex = Math.floor(Math.random() * state.population.length);
        startPerson = state.population[startIndex];
    }
    
    // Set researcher location
    state.researcherLocation = {
        x: startPerson.x,
        y: startPerson.y,
        maxRadius: 0
    };
    
    // Calculate distances from start point
    const distances = state.population.map((person, index) => ({
        index,
        distance: Math.hypot(person.x - startPerson.x, person.y - startPerson.y)
    }));
    
    // Sort by distance and select closest
    distances.sort((a, b) => a.distance - b.distance);
    
    // Start animation loop
    requestAnimationFrame(animationLoop);
    
    // Show researcher appearing
    await sleep(1000);
    
    // Animate expanding convenience radius and sample selection
    for (let i = 0; i < state.sampleSize && i < distances.length; i++) {
        await sleep(250);
        const personIndex = distances[i].index;
        const person = state.population[personIndex];
        
        // Update radius to show expanding search area
        state.researcherLocation.maxRadius = distances[i].distance;
        
        person.selected = true;
        state.selectedSamples.push(person);
        moveSampleToArea(person, i);
        updateSampleCount();
    }
    
    // Wait for animation to complete
    await sleep(2000);
    
    // Clear researcher location
    state.researcherLocation = null;
    
    finishSampling();
}

async function animateQuotaSampling() {
    // Set quota per group (not necessarily proportional)
    const quotaPerGroup = Math.ceil(state.sampleSize / state.scenario.groups.length);
    
    // Start animation loop
    requestAnimationFrame(animationLoop);
    
    let sampleIndex = 0;
    
    for (const group of state.scenario.groups) {
        const groupMembers = state.population.filter(p => p.group === group.name && !p.selected);
        const quota = Math.min(quotaPerGroup, groupMembers.length);
        
        // Quota sampling uses convenience/judgment within quotas (not random)
        // Sort by convenience (proximity to left side, representing researcher bias)
        const conveniencePoint = {
            x: state.populationCircle.x - state.populationCircle.radius * 0.4,
            y: state.populationCircle.y
        };
        
        groupMembers.sort((a, b) => {
            const distA = Math.hypot(a.x - conveniencePoint.x, a.y - conveniencePoint.y);
            const distB = Math.hypot(b.x - conveniencePoint.x, b.y - conveniencePoint.y);
            return distA - distB;
        });
        
        // Select most convenient members for this quota
        for (let i = 0; i < quota; i++) {
            await sleep(300);
            const person = groupMembers[i];
            person.selected = true;
            state.selectedSamples.push(person);
            moveSampleToArea(person, sampleIndex);
            sampleIndex++;
            updateSampleCount();
        }
    }
    
    // Wait for animation to complete
    await sleep(2000);
    
    finishSampling();
}

function finishSampling() {
    state.isAnimating = false;
    document.getElementById('sample-btn').disabled = false;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================================================
// DATA VIEW FUNCTIONS
// ============================================================================

function handleViewData() {
    const modal = document.getElementById('data-modal');
    modal.style.display = 'flex';
    populateDataTable();
}

function handleCloseData() {
    const modal = document.getElementById('data-modal');
    modal.style.display = 'none';
}

function populateDataTable() {
    // Update info section
    document.getElementById('data-pop-size').textContent = state.population.length;
    document.getElementById('data-sample-size').textContent = state.selectedSamples.length;
    document.getElementById('data-scenario').textContent = state.scenario.name;
    
    // Update metric header
    const metricHeader = document.querySelector('.data-metric-header');
    metricHeader.textContent = state.scenario.metric;
    
    // Show/hide cluster column based on whether we're in cluster mode
    const clusterHeader = document.getElementById('cluster-header');
    const showCluster = state.currentMethod === 'cluster' && state.population.length > 0 && state.population[0].clusterName;
    clusterHeader.style.display = showCluster ? '' : 'none';
    
    // Get table body
    const tbody = document.getElementById('data-table-body');
    tbody.innerHTML = '';
    
    // Sort population by ID for consistent ordering
    const sortedPopulation = [...state.population].sort((a, b) => a.id - b.id);
    
    // Create rows for each person
    sortedPopulation.forEach(person => {
        const row = document.createElement('tr');
        const isSampled = state.selectedSamples.includes(person);
        
        if (isSampled) {
            row.classList.add('sampled');
        }
        
        // ID column
        const idCell = document.createElement('td');
        idCell.textContent = person.id + 1; // Display 1-indexed
        row.appendChild(idCell);
        
        // Cluster column (only if in cluster mode)
        if (showCluster) {
            const clusterCell = document.createElement('td');
            clusterCell.textContent = person.clusterName || `Cluster ${person.cluster + 1}`;
            row.appendChild(clusterCell);
        }
        
        // Group column with color indicator
        const groupCell = document.createElement('td');
        groupCell.className = 'group-cell';
        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'group-color-indicator';
        colorIndicator.style.backgroundColor = person.color;
        groupCell.appendChild(colorIndicator);
        groupCell.appendChild(document.createTextNode(person.group));
        row.appendChild(groupCell);
        
        // Value column
        const valueCell = document.createElement('td');
        valueCell.className = 'value-cell';
        valueCell.textContent = person.value.toFixed(2);
        row.appendChild(valueCell);
        
        tbody.appendChild(row);
    });
}

function handleExportCSV() {
    // Sort population by ID for consistent ordering
    const sortedPopulation = [...state.population].sort((a, b) => a.id - b.id);
    
    // Check if we should include cluster column
    const includeCluster = state.currentMethod === 'cluster' && sortedPopulation.length > 0 && sortedPopulation[0].clusterName;
    
    // Create CSV content
    const headers = includeCluster 
        ? ['ID', 'Cluster', 'Group', state.scenario.metric]
        : ['ID', 'Group', state.scenario.metric];
    const rows = [headers.join(',')];
    
    sortedPopulation.forEach(person => {
        const row = includeCluster
            ? [
                person.id + 1, // 1-indexed
                `"${person.clusterName || `Cluster ${person.cluster + 1}`}"`,
                `"${person.group}"`, // Quote group names in case they contain commas
                person.value.toFixed(2)
              ]
            : [
                person.id + 1, // 1-indexed
                `"${person.group}"`, // Quote group names in case they contain commas
                person.value.toFixed(2)
              ];
        rows.push(row.join(','));
    });
    
    const csvContent = rows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename based on scenario and timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const scenarioName = state.scenario.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `sampling_${scenarioName}_${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
