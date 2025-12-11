import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// InteractiveGraph.jsx
// Usage: import InteractiveGraph from './InteractiveGraph'; then include <InteractiveGraph />

export default function InteractiveGraph() {
  const svgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    // responsive size from parent container
    const parent = svgEl.parentNode;
    const getSize = () => ({
      width: Math.max(300, parent.clientWidth || 900),
      height: Math.max(300, parent.clientHeight || 600)
    });

    const { width, height } = getSize();

    // clear
    d3.select(svgEl).selectAll('*').remove();

    const svg = d3.select(svgEl)
      .attr('width', width)
      .attr('height', height)
      .style('background', '#18181b');

    const g = svg.append('g');


    const links = nodes
      .filter(n => n.id !== 'sumukh')
      .map(n => ({ source: 'sumukh', target: n.id }));

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(180))
      .force('charge', d3.forceManyBody().strength(-450))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#6ea3d9')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    // Nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    node.append('circle')
      .attr('r', d => d.type === 'central' ? 20 : 12)
      .attr('fill', d => d.type === 'central' ? '#ff6b6b' : '#6ea3d9')
      .attr('stroke', '#111')
      .attr('stroke-width', 1.5)
      .style('cursor', 'grab');

    node.append('text')
      .text(d => d.label)
      .attr('x', 0)
      .attr('y', d => d.type === 'central' ? 34 : 24)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e6e6e6')
      .attr('font-size', d => d.type === 'central' ? '16px' : '12px')
      .attr('font-weight', d => d.type === 'central' ? '600' : '400')
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    node.on('mouseenter', function (event, d) {
      d3.select(this).select('circle')
        .transition().duration(150)
        .attr('r', d.type === 'central' ? 26 : 16);
      setSelectedNode(d.label);
    })
      .on('mouseleave', function (event, d) {
        d3.select(this).select('circle')
          .transition().duration(150)
          .attr('r', d.type === 'central' ? 20 : 12);
        setSelectedNode(null);
      })
      .on('click', function (event, d) {
        // example action
        console.log('Clicked node:', d.label);
      });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // drag handlers
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // handle window resize
    const ro = new ResizeObserver(() => {
      const s = getSize();
      svg.attr('width', s.width).attr('height', s.height);
      simulation.force('center', d3.forceCenter(s.width / 2, s.height / 2));
      simulation.alpha(0.3).restart();
    });
    ro.observe(parent);

    // cleanup on unmount
    return () => {
      ro.disconnect();
      simulation.stop();
      svg.selectAll('*').remove();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#0f1720', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#2563eb', color: '#fff', padding: '12px 16px' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Interactive Graph</h2>
        {selectedNode && <div style={{ marginTop: 6, opacity: 0.9 }}>Hovering: {selectedNode}</div>}
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />

        <div style={{ position: 'absolute', bottom: 20, right: 20, background: '#111827', color: '#fff', padding: '10px 12px', borderRadius: 8, fontSize: 13 }}>
          <strong>Controls</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: '1.05em' }}>
            <li>Drag nodes to reposition</li>
            <li>Scroll to zoom / drag background to pan</li>
            <li>Click nodes for actions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
