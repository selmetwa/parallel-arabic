<script lang="ts">
  import { onMount, onDestroy, untrack, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import * as d3 from 'd3';

  interface MapWord {
    id: string;
    arabic: string;
    english: string;
    transliteration: string;
    dialect: string;
    category: string;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
  }

  interface BBox {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  }

  interface Props {
    words: MapWord[];
    preview?: boolean;
  }

  let { words, preview = false }: Props = $props();

  let svgEl: SVGSVGElement;
  let containerEl: HTMLDivElement;
  let hoveredWord = $state<MapWord | null>(null);
  let tooltipX = $state(0);
  let tooltipY = $state(0);
  let isLoading = $state(true);

  // ISO_A3 → dialect
  const COUNTRY_DIALECT: Record<string, string> = {
    EGY: 'egyptian-arabic',
    MAR: 'darija',
    DZA: 'darija',
    SYR: 'levantine',
    LBN: 'levantine',
    JOR: 'levantine',
    ISR: 'levantine',
    PSE: 'levantine',
    SAU: 'fusha',
    QAT: 'fusha',
    OMN: 'fusha',
    KWT: 'fusha',
    BHR: 'fusha',
    ARE: 'fusha',
    IRQ: 'fusha',
  };

  // Dialect → highlighted fill color (used for tooltips/badges — hex required)
  const DIALECT_COLOR: Record<string, string> = {
    'egyptian-arabic': '#8fb3c2', // approximates tile4 for badge display
    darija: '#22c55e',
    levantine: '#f97316',
    fusha: '#a855f7',
  };

  // Dialect → map fill style (CSS vars allowed here — evaluated by the browser)
  function dialectMapFill(dialect: string, hover = false): string {
    if (dialect === 'egyptian-arabic') {
      return hover
        ? `fill: var(--tile5); stroke: var(--tile6); stroke-width: 2px; cursor: pointer;`
        : `fill: var(--tile4); stroke: var(--tile6); stroke-width: 1.2px; cursor: pointer;`;
    }
    const color = DIALECT_COLOR[dialect];
    const isClickable = !!DIALECT_ROUTE[dialect];
    const cursor = isClickable ? ' cursor: pointer;' : '';
    return hover
      ? `fill: ${color}; stroke: ${color}; stroke-width: 2px;${cursor}`
      : `fill: ${color}cc; stroke: ${color}; stroke-width: 1.2px;${cursor}`;
  }

  // Dialect → landing page route
  const DIALECT_ROUTE: Record<string, string> = {
    'egyptian-arabic': '/egyptian-arabic',
    darija: '/darija',
    levantine: '/levantine',
    fusha: '/fusha',
  };

  const DIALECT_LABEL: Record<string, string> = {
    'egyptian-arabic': 'Egyptian Arabic',
    darija: 'Darija',
    levantine: 'Levantine',
    fusha: 'Modern Standard Arabic',
  };

  // Dialect geographic centers [lng, lat]
  const DIALECT_CENTERS: Record<string, [number, number]> = {
    'egyptian-arabic': [30.8, 26.8],
    levantine: [36.2, 33.9],
    darija: [-5.0, 31.8],
    fusha: [38.0, 25.0],
  };

  /** Map DB / UI dialect slugs to keys used in COUNTRY_DIALECT + dialectBBoxes */
  function normalizeDialect(d: string): string {
    const raw = (d || 'egyptian-arabic').trim();
    const aliases: Record<string, string> = {
      egyptian: 'egyptian-arabic',
      'modern-standard-arabic': 'fusha',
      msa: 'fusha',
      khaleeji: 'fusha',
    };
    const mapped = aliases[raw] ?? raw;
    if (mapped in DIALECT_COLOR) return mapped;
    return 'egyptian-arabic';
  }

  const CATEGORY_COLORS = [
    '#e07b54', '#5b8dd9', '#6bbf72', '#c97fd4',
    '#e8c84a', '#d96b6b', '#4abfbf', '#a07850',
    '#8888d8', '#72b8a0', '#d4846b', '#888888',
  ];

  const categoryColors = $derived.by(() => {
    const cats = [...new Set(words.map((w) => w.category))].sort();
    const map: Record<string, string> = {};
    cats.forEach((cat, i) => {
      map[cat] = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    });
    return map;
  });

  const uniqueCategories = $derived([...new Set(words.map((w) => w.category))].sort());

  let simulation: d3.Simulation<any, any> | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let resizeTimer: ReturnType<typeof setTimeout>;
  let geoData = $state<any>(null);

  onMount(async () => {
    geoData = await d3.json('/data/med-region.geojson');
    // bind:this + layout: first effect tick can run before refs exist; tick ensures svg/container are set
    await tick();
    untrack(() => buildMap());

    resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => untrack(() => buildMap()), 250);
    });
    resizeObserver.observe(containerEl);
  });

  /** Rebuild when saved words change (geo + initial build handled in onMount after tick). */
  $effect(() => {
    words;
    if (!geoData || !svgEl || !containerEl) return;
    untrack(() => buildMap());
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
    simulation?.stop();
    clearTimeout(resizeTimer);
  });

  function buildMap() {
    if (!geoData || !svgEl || !containerEl) return;

    isLoading = true;
    try {
    d3.select(svgEl).selectAll('*').remove();

    const rect = containerEl.getBoundingClientRect();
    const width = Math.max(rect.width, 300);
    const isMobile = width < 640;
    const height = isMobile ? width * 1.1 : width * 0.62;
    // In preview mode the map is zoomed in, so nodeR must be much smaller
    // to avoid huge blobs. Scale continuously with container width.
    const nodeR = preview ? Math.max(0.2, width / 1600) : (isMobile ? 2.5 : 0.55);
    // Collision radius scales with nodeR so spacing between nodes stays proportional
    const collideR = nodeR * 2;

    const svgSel = d3.select(svgEl).attr('width', width).attr('height', height);

    // Ocean/sea background — uses tile4 CSS variable so it adapts to light/dark/dim themes
    svgSel.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('style', 'fill: var(--tile5);');

    const zoomGroup = svgSel.append('g').attr('class', 'zoom-root');

    // fitExtent auto-computes center + scale so ALL GeoJSON features fit within the SVG.
    // clipExtent removes the antipodal clipping rectangle D3 appends to each feature path
    // for spherical geometry — without it, features render as "inverted" (world filled,
    // country is a transparent hole).
    const pad = 28;
    const projection = d3.geoMercator()
      .fitExtent([[pad, pad], [width - pad, height - pad]], geoData);
    projection.clipExtent([[0, 0], [width, height]]);

    // Pre-project GeoJSON coordinates to pixel space.
    // D3's geoPath with a spherical projection appends an antipodal clipping rectangle
    // (e.g. "M4305,-3417...M-4755,5643") to every feature path. For features whose exterior
    // ring is wound clockwise the clip causes the entire viewport to fill and the country
    // appears as a transparent hole. Pre-projecting and using a flat (no-projection) geoPath
    // bypasses the spherical clipping pipeline entirely.
    function projectRing(ring: [number, number][]): [number, number][] {
      return ring.reduce<[number, number][]>((acc, coord) => {
        const p = projection(coord);
        if (p && isFinite(p[0]) && isFinite(p[1])) acc.push([p[0], p[1]]);
        return acc;
      }, []);
    }
    function projectGeometry(geom: any): any {
      if (!geom) return null;
      if (geom.type === 'Polygon')
        return { ...geom, coordinates: geom.coordinates.map(projectRing) };
      if (geom.type === 'MultiPolygon')
        return { ...geom, coordinates: geom.coordinates.map((poly: any) => poly.map(projectRing)) };
      return geom;
    }
    const projectedFeatures = geoData.features.map((f: any) => ({
      ...f,
      geometry: projectGeometry(f.geometry),
    }));
    const flatPath = d3.geoPath(); // no projection → renders pre-projected pixel coords as-is

    // Country fills: dialect regions get a tinted color fill + pointer cursor and are clickable.
    zoomGroup
      .selectAll<SVGPathElement, any>('path.country')
      .data(projectedFeatures)
      .join('path')
      .attr('class', 'country')
      .attr('d', (d) => flatPath(d) ?? '')
      .attr('style', (d) => {
        const dialect = COUNTRY_DIALECT[d.properties.ISO_A3];
        if (dialect) return dialectMapFill(dialect);
        return 'fill: var(--tile3); stroke: var(--tile5); stroke-width: 0.6px;';
      })
      .on('mouseover', function(_event, d) {
        const dialect = COUNTRY_DIALECT[d.properties.ISO_A3];
        if (dialect && DIALECT_ROUTE[dialect]) {
          d3.select(this).attr('style', dialectMapFill(dialect, true));
        }
      })
      .on('mouseout', function(_event, d) {
        const dialect = COUNTRY_DIALECT[d.properties.ISO_A3];
        if (dialect) {
          d3.select(this).attr('style', dialectMapFill(dialect));
        }
      })
      .on('click', (_event, d) => {
        const dialect = COUNTRY_DIALECT[d.properties.ISO_A3];
        if (dialect && DIALECT_ROUTE[dialect]) {
          goto(DIALECT_ROUTE[dialect]);
        }
      });

    // Build dialect bounding boxes by projecting the raw GeoJSON coordinates.
    // We CANNOT use pathGen.bounds() here because D3 appends an antipodal clipping
    // rectangle to each feature path (visible as the "M4305,-3417...M-4755,5643" segment
    // in the SVG), which inflates the bounding box to thousands of pixels in every direction.
    const dialectBBoxes: Record<string, BBox> = {};

    for (const feature of geoData.features) {
      const iso = feature.properties.ISO_A3;
      const dialect = COUNTRY_DIALECT[iso];
      if (!dialect || !feature.geometry) continue;

      // Collect all exterior-ring vertices for this feature
      let rings: [number, number][][] = [];
      if (feature.geometry.type === 'Polygon') {
        rings = [feature.geometry.coordinates[0]];
      } else if (feature.geometry.type === 'MultiPolygon') {
        rings = feature.geometry.coordinates.map((poly: [number, number][][]) => poly[0]);
      }

      for (const ring of rings) {
        for (const coord of ring) {
          const pt = projection(coord as [number, number]);
          if (!pt || !isFinite(pt[0]) || !isFinite(pt[1])) continue;
          // Ignore points wildly outside the viewport. With fitExtent + clipExtent these
          // should no longer appear, but guard anyway.
          if (pt[0] < -pad || pt[0] > width + pad || pt[1] < -pad || pt[1] > height + pad) continue;

          if (!dialectBBoxes[dialect]) {
            dialectBBoxes[dialect] = { x0: pt[0], y0: pt[1], x1: pt[0], y1: pt[1] };
          } else {
            const b = dialectBBoxes[dialect];
            b.x0 = Math.min(b.x0, pt[0]);
            b.y0 = Math.min(b.y0, pt[1]);
            b.x1 = Math.max(b.x1, pt[0]);
            b.y1 = Math.max(b.y1, pt[1]);
          }
        }
      }
    }

    // Fusha: floating cluster in the center of the map
    // const fushaProj = projection(DIALECT_CENTERS['fusha']) ?? [width / 2, height / 2];
    // const fushaSize = isMobile ? 35 : 50;
    // dialectBBoxes['fusha'] = {
    //   x0: fushaProj[0] - fushaSize,
    //   y0: fushaProj[1] - fushaSize,
    //   x1: fushaProj[0] + fushaSize,
    //   y1: fushaProj[1] + fushaSize,
    // };

    // Compute pixel-space center for each dialect (used as gravity target)
    const dialectCenters: Record<string, [number, number]> = {};
    for (const [dialect, bbox] of Object.entries(dialectBBoxes)) {
      dialectCenters[dialect] = [(bbox.x0 + bbox.x1) / 2, (bbox.y0 + bbox.y1) / 2];
    }

    const wordsNorm: MapWord[] = words.map((w) => ({
      ...w,
      dialect: normalizeDialect(w.dialect || 'egyptian-arabic'),
    }));

    // Add a subtle fusha region indicator if there are fusha words
    // const hasFusha = wordsNorm.some((w) => w.dialect === 'fusha');
    // if (hasFusha) {
    //   const fb = dialectBBoxes['fusha'];
    //   zoomGroup
    //     .append('ellipse')
    //     .attr('cx', (fb.x0 + fb.x1) / 2)
    //     .attr('cy', (fb.y0 + fb.y1) / 2)
    //     .attr('rx', (fb.x1 - fb.x0) / 2 + nodeR * 2)
    //     .attr('ry', (fb.y1 - fb.y0) / 2 + nodeR * 2)
    //     .attr('fill', DIALECT_COLOR['fusha'] + '33')
    //     .attr('stroke', DIALECT_COLOR['fusha'] + '88')
    //     .attr('stroke-width', 1)
    //     .attr('stroke-dasharray', '4 3');
    // }

    // Sample words if too many
    const displayWords: MapWord[] =
      wordsNorm.length > 400
        ? [...wordsNorm].sort(() => Math.random() - 0.5).slice(0, 400)
        : [...wordsNorm];

    // Build colors from words in this run (avoid stale $derived when called inside untrack)
    const cats = [...new Set(displayWords.map((w) => w.category))].sort();
    const colorsSnapshot: Record<string, string> = {};
    cats.forEach((cat, i) => {
      colorsSnapshot[cat] = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    });

    // Seed nodes with initial positions by category within dialect bbox
    const nodes = seedNodes(displayWords, dialectBBoxes);

    // Run force simulation synchronously
    simulation?.stop();
    simulation = d3.forceSimulation(nodes)
      .force('collide', d3.forceCollide(collideR).strength(1).iterations(4))
      .force('x', d3.forceX<MapWord>((d) => dialectCenters[d.dialect]?.[0] ?? width / 2).strength(0.15))
      .force('y', d3.forceY<MapWord>((d) => dialectCenters[d.dialect]?.[1] ?? height / 2).strength(0.15))
      .force('cluster', createClusterForce(0.25))
      .alphaDecay(0.02)
      .velocityDecay(0.35)
      .stop();

    simulation.tick(600);

    // Render nodes
    const nodesGroup = zoomGroup.append('g').attr('class', 'nodes');

    const nodeEls = nodesGroup
      .selectAll<SVGGElement, MapWord>('g.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      .style('cursor', 'pointer')
      .on('mouseenter', (event: MouseEvent, d: MapWord) => {
        hoveredWord = d;
        tooltipX = event.clientX + 14;
        tooltipY = event.clientY - 44;
        d3.select(event.currentTarget as SVGGElement).select('.node-label').style('opacity', 1);
      })
      .on('mouseleave', (event: MouseEvent) => {
        hoveredWord = null;
        d3.select(event.currentTarget as SVGGElement).select('.node-label').style('opacity', 0);
      });

    nodeEls
      .append('circle')
      .attr('r', nodeR)
      .attr('fill', (d) => colorsSnapshot[d.category] ?? '#888888')
      // .attr('stroke', 'rgba(255,255,255,0.30)')
      // .attr('stroke-width', 1);

    // nodeEls
    //   .append('text')
    //   .attr('class', 'node-label')
    //   .attr('dy', '0.35em')
    //   .attr('x', nodeR + 3)
    //   .attr('font-size', isMobile ? '7px' : '9px')
    //   .attr('fill', '#cccccc')
    //   .attr('pointer-events', 'none')
    //   .style('opacity', 0)
    //   .text((d) => (d.english.length > 13 ? d.english.slice(0, 12) + '…' : d.english));

    if (preview) {
      // Zoom in on the Middle East for the homepage preview.
      // Narrower containers need more zoom; wider ones already show more area naturally.
      const geoCenter: [number, number] = [20, 17];
      const center = projection(geoCenter) ?? [width / 2, height / 2];
      const k = Math.max(5.5, Math.min(6, 1400 / width));
      const tx = width / 2 - k * center[0];
      const ty = height / 2 - k * center[1];
      zoomGroup.attr('transform', `translate(${tx},${ty}) scale(${k})`);
    } else {
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.4, 15])
        .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          zoomGroup.attr('transform', event.transform.toString());
        });

      // Start zoomed in on the dialect region with nodes
      const dialects = [...new Set(displayWords.map((w) => w.dialect))];
      if (dialects.length > 0 && dialectCenters[dialects[0]]) {
        const center = dialectCenters[dialects[0]];
        const k = 6;
        const tx = width / 2 - k * center[0];
        const ty = height / 2 - k * center[1];
        const initialTransform = d3.zoomIdentity.translate(tx, ty).scale(k);
        svgSel.call(zoom.transform, initialTransform);
      }

      svgSel.call(zoom);
    }
    } finally {
      isLoading = false;
    }
  }

  function seedNodes(words: MapWord[], dialectBBoxes: Record<string, BBox>): MapWord[] {
    const byDialect = new Map<string, Map<string, MapWord[]>>();

    for (const word of words) {
      const d = word.dialect || 'egyptian-arabic';
      if (!byDialect.has(d)) byDialect.set(d, new Map());
      const byCat = byDialect.get(d)!;
      if (!byCat.has(word.category)) byCat.set(word.category, []);
      byCat.get(word.category)!.push(word);
    }

    const result: MapWord[] = [];

    for (const [dialect, byCat] of byDialect) {
      const bbox = dialectBBoxes[dialect];
      const bboxW = bbox ? bbox.x1 - bbox.x0 : 80;
      const bboxH = bbox ? bbox.y1 - bbox.y0 : 80;
      const fallbackX = bbox ? (bbox.x0 + bbox.x1) / 2 : 400;
      const fallbackY = bbox ? (bbox.y0 + bbox.y1) / 2 : 300;

      const categories = [...byCat.keys()];
      const cols = Math.max(1, Math.ceil(Math.sqrt(categories.length)));
      const rows = Math.ceil(categories.length / cols);

      categories.forEach((cat, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const cx = bbox ? bbox.x0 + bboxW * (col + 0.5) / cols : fallbackX + (col - cols / 2) * 20;
        const cy = bbox ? bbox.y0 + bboxH * (row + 0.5) / rows : fallbackY + (row - rows / 2) * 20;
        const spreadX = bbox ? (bboxW / cols) * 0.2 : 10;
        const spreadY = bbox ? (bboxH / rows) * 0.2 : 10;

        for (const word of byCat.get(cat)!) {
          result.push({
            ...word,
            x: cx + (Math.random() - 0.5) * spreadX,
            y: cy + (Math.random() - 0.5) * spreadY,
            vx: 0,
            vy: 0,
          });
        }
      });
    }

    return result;
  }

  function createClusterForce(strength: number) {
    let nodesRef: any[] = [];

    function force(alpha: number) {
      // Compute centroids per dialect+category
      const centroids = new Map<string, { x: number; y: number; n: number }>();
      for (const node of nodesRef) {
        const key = `${node.dialect}::${node.category}`;
        if (!centroids.has(key)) centroids.set(key, { x: 0, y: 0, n: 0 });
        const c = centroids.get(key)!;
        c.x += node.x ?? 0;
        c.y += node.y ?? 0;
        c.n++;
      }
      for (const c of centroids.values()) { c.x /= c.n; c.y /= c.n; }

      for (const node of nodesRef) {
        const key = `${node.dialect}::${node.category}`;
        const c = centroids.get(key);
        if (!c) continue;
        node.vx += (c.x - (node.x ?? 0)) * strength * alpha;
        node.vy += (c.y - (node.y ?? 0)) * strength * alpha;
      }
    }

    (force as any).initialize = (nodes: any[]) => { nodesRef = nodes; };
    return force;
  }

</script>

<div class="relative w-full min-h-[300px]" bind:this={containerEl}>
  {#if isLoading}
    <div
      class="absolute inset-0 z-10 flex items-center justify-center text-text-200 text-sm pointer-events-none rounded-xl bg-tile-400/40"
    >
      Building map...
    </div>
  {/if}

  <svg bind:this={svgEl} class="w-full block rounded-xl overflow-hidden min-h-[300px]"></svg>

  <!-- Tooltip -->
  {#if hoveredWord}
    <div
      class="fixed z-50 pointer-events-none rounded-xl px-4 py-3 shadow-xl text-sm max-w-xs"
      style="left: {tooltipX}px; top: {tooltipY}px; background: rgba(15,15,25,0.92); border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(8px);"
    >
      <p class="text-xl font-bold mb-1 leading-tight" dir="rtl" style="color: #ffffff;">{hoveredWord.arabic}</p>
      <p class="font-semibold" style="color: #eeeeee;">{hoveredWord.english}</p>
      {#if hoveredWord.transliteration}
        <p class="text-xs italic mt-0.5" style="color: #999999;">{hoveredWord.transliteration}</p>
      {/if}
      <div class="flex flex-wrap gap-1.5 mt-2">
        <span
          class="text-xs px-2 py-0.5 rounded-full inline-block"
          style="background: {categoryColors[hoveredWord.category] ?? '#888888'}28; color: {categoryColors[hoveredWord.category] ?? '#888888'};"
        >
          {hoveredWord.category}
        </span>
        <span
          class="text-xs px-2 py-0.5 rounded-full inline-block"
          style="background: {DIALECT_COLOR[hoveredWord.dialect] ?? '#888888'}28; color: {DIALECT_COLOR[hoveredWord.dialect] ?? '#888888'};"
        >
          {DIALECT_LABEL[hoveredWord.dialect] ?? hoveredWord.dialect}
        </span>
      </div>
    </div>
  {/if}

  <!-- Legend (hidden in preview mode) -->
  {#if uniqueCategories.length > 0 && !preview}
    <div
      class="absolute bottom-4 right-4 rounded-xl p-3 text-xs"
      style="background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); max-height: 200px; overflow-y: auto;"
    >
      <p class="font-semibold mb-2" style="color: #cccccc;">Categories</p>
      {#each uniqueCategories as cat (cat)}
        <div class="flex items-center gap-2 mb-1 whitespace-nowrap">
          <span
            class="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style="background: {categoryColors[cat] ?? '#888888'};"
          ></span>
          <span style="color: #aaaaaa;">{cat}</span>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Hint (hidden in preview mode) -->
  {#if !preview}
    <p class="text-xs mt-2 text-center" style="color: #666666;">
      Scroll to zoom · Drag to pan · Hover words for details
    </p>
  {/if}
</div>
