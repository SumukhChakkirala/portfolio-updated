import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

export default function InteractiveGraph() {
  const svgRef = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const parent = svgEl.parentNode
    const getSize = () => ({ width: Math.max(300, parent.clientWidth || 900), height: Math.max(300, parent.clientHeight || 600) })
    const { width, height } = getSize()

    d3.select(svgEl).selectAll('*').remove()
    const svg = d3.select(svgEl).attr('width', width).attr('height', height).style('background', '#18181b')
    const g = svg.append('g')

    const nodes = [
      { id: 'skar', label: 'skar', type: 'central' },
      { id: 'robot', label: 'The Parable of The Robot Pirate', type: 'content' },
      { id: 'intuition', label: 'The Dangerous Intuition Of David Bohm', type: 'content' },
      { id: 'alien', label: 'On An Alien Planet', type: 'content' },
      { id: 'charkhas', label: 'On Charkhas, AI & Economic Growth', type: 'content' },
      { id: 'magic', label: 'This Magic Trick Has No Secrets', type: 'content' },
      { id: 'causality', label: 'The Unsettling Physics of Causality', type: 'content' },
      { id: 'questions', label: 'questions', type: 'content' },
      { id: 'generality', label: 'Unbounded Generality', type: 'content' },
      { id: 'compression', label: 'The Pāṇinian Approach to Compression', type: 'content' }
    ]

    const links = nodes.filter(n => n.id !== 'skar').map(n => ({ source: 'skar', target: n.id }))

    const zoom = d3.zoom().scaleExtent([0.5, 3]).on('zoom', (event) => g.attr('transform', event.transform))
    svg.call(zoom)

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(180))
      .force('charge', d3.forceManyBody().strength(-450))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))

    const link = g.append('g').attr('class', 'links').selectAll('line').data(links).join('line').attr('stroke', '#6ea3d9').attr('stroke-width', 2).attr('stroke-opacity', 0.6)

    const node = g.append('g').attr('class', 'nodes').selectAll('g').data(nodes).join('g').call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended))

    node.append('circle').attr('r', d => d.type === 'central' ? 20 : 12).attr('fill', d => d.type === 'central' ? '#ff6b6b' : '#6ea3d9').attr('stroke', '#111').attr('stroke-width', 1.5).style('cursor', 'grab')

    node.append('text').text(d => d.label).attr('x', 0).attr('y', d => d.type === 'central' ? 34 : 24).attr('text-anchor', 'middle').attr('fill', '#e6e6e6').attr('font-size', d => d.type === 'central' ? '16px' : '12px').attr('font-weight', d => d.type === 'central' ? '600' : '400').style('pointer-events', 'none')

    node.on('mouseenter', function (event, d) {
      d3.select(this).select('circle').transition().duration(150).attr('r', d.type === 'central' ? 26 : 16)
      setSelectedNode(d.label)
    }).on('mouseleave', function (event, d) {
      d3.select(this).select('circle').transition().duration(150).attr('r', d.type === 'central' ? 20 : 12)
      setSelectedNode(null)
    }).on('click', function (event, d) {
      console.log('Clicked node:', d.label)
    })

    simulation.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y)
      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    const ro = new ResizeObserver(() => {
      const s = getSize()
      svg.attr('width', s.width).attr('height', s.height)
      simulation.force('center', d3.forceCenter(s.width / 2, s.height / 2))
      simulation.alpha(0.3).restart()
    })
    ro.observe(parent)

    return () => {
      ro.disconnect()
      simulation.stop()
      d3.select(svgEl).selectAll('*').remove()
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh', background: '#0f1720', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#2563eb', color: '#fff', padding: '12px 16px' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Interactive Graph</h2>
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}
