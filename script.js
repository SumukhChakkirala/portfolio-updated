// Theme toggle and persistence
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const icon = document.getElementById('theme-icon');

    html.setAttribute('data-theme', newTheme);
    if (icon) icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';

    localStorage.setItem('theme', newTheme);
}

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
const themeIcon = document.getElementById('theme-icon');
if (themeIcon) themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';


function getNodesFromLinks() {
    // Central node is always 'skar'
    const nodes = [{ id: 'sumukh', label: 'sumukh', isCenter: true }];
    // Get areas of interest from the <ol> in .interests
    const interestList = document.querySelector('.interests ol');
    if (!interestList) return nodes;
    const items = Array.from(interestList.querySelectorAll('li'));
    items.forEach((li, idx) => {
        const text = li.textContent.trim();
        if (text) {
            nodes.push({
                id: text.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                label: text,
                isCenter: false
            });
        }
    });
    return nodes;
}

function getConnectionsFromNodes(nodes) {
    // Connect 'skar' to all other nodes
    const centerId = 'sumukh';
    return nodes.filter(n => n.id !== centerId).map(n => [centerId, n.id]);
}


function initD3Graph(graphContainer) {
    if (!graphContainer || typeof d3 === 'undefined') return;
    const nodes = getNodesFromLinks();
    const connections = getConnectionsFromNodes(nodes);
    const rect = graphContainer.getBoundingClientRect();
    const width = rect.width || graphContainer.offsetWidth || 600;
    const height = rect.height || graphContainer.offsetHeight || 400;
    graphContainer.innerHTML = '';

    // create svg
    const svg = d3.select(graphContainer)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('display', 'block');

    const g = svg.append('g');

    // prepare d3 nodes/links from extracted arrays
    const d3Nodes = nodes.map(n => ({ id: n.id, label: n.label, isCenter: !!n.isCenter }));
    const d3Links = connections.map(([a, b]) => ({ source: a, target: b }));

    // zoom
    const zoom = d3.zoom().scaleExtent([0.5, 3]).on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    const link = g.append('g').attr('class', 'links').selectAll('line').data(d3Links).join('line')
        .attr('stroke', 'rgba(107,155,209,0.6)')
        .attr('stroke-width', 2);

    const node = g.append('g').attr('class', 'nodes').selectAll('g').data(d3Nodes).join('g').call(d3.drag()
        .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    );

    node.append('circle')
        .attr('r', d => d.isCenter ? 10 : 7)
        .attr('fill', d => d.isCenter ? '#FF6B6B' : '#6B9BD1')
        .style('cursor', 'pointer');

    node.append('text')
        .text(d => d.label)
        .attr('x', 0)
        .attr('y', d => d.isCenter ? 18 : 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e6e6e6')
        .attr('font-size', '11px')
        .style('pointer-events', 'none');

    node.on('mouseenter', function(event, d) {
        d3.select(this).select('circle').transition().duration(120).attr('r', d.isCenter ? 14 : 10);
    }).on('mouseleave', function(event, d) {
        d3.select(this).select('circle').transition().duration(120).attr('r', d.isCenter ? 10 : 7);
    }).on('click', function(event, d) {
        console.log('Clicked', d.label);
    });

    const simulation = d3.forceSimulation(d3Nodes)
        .force('link', d3.forceLink(d3Links).id(d => d.id).distance(120))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(20));

    simulation.on('tick', () => {
        link.attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // keep responsive
    const ro = new ResizeObserver(() => {
        const r = graphContainer.getBoundingClientRect();
        svg.attr('width', r.width).attr('height', r.height);
        simulation.force('center', d3.forceCenter(r.width / 2, r.height / 2));
        simulation.alpha(0.3).restart();
    });
    ro.observe(graphContainer);
}

function initGraph() {
    const graphEl = document.getElementById('graph-canvas');
    if (!graphEl) return;
    initD3Graph(graphEl);
    window.addEventListener('resize', () => initD3Graph(graphEl));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGraph);
} else {
    initGraph();
}
