import type { AlertLevel } from './types';

export type Language = 'pt' | 'en';

export function formatRecommendation(
  lang: Language,
  regionName: string,
  status: AlertLevel,
  devPct: number,
): string {
  const signed = `${devPct >= 0 ? '+' : ''}${devPct.toFixed(1)}%`;
  if (lang === 'en') {
    if (status === 'critical') {
      return `Critical Alert in ${regionName}: cumulative fire curve is ${signed} above the MODIS historical baseline. Early mobilization of brigades and focus on critical grid quadrants ahead of peak dry season is recommended.`;
    }
    if (status === 'elevated') {
      return `Elevated Attention in ${regionName}: cumulative trend (${signed}) exceeds the normal historical range. Increase satellite monitoring and Civil Defense readiness.`;
    }
    return `Within historical baseline in ${regionName} (${signed} vs. MODIS average). Maintain routine preventive monitoring.`;
  }

  if (status === 'critical') {
    return `Alerta Crítico em ${regionName}: curva acumulada está ${signed} acima da média histórica MODIS. Recomenda-se mobilização antecipada de brigadas e foco nos quadrantes críticos antes do pico de seca.`;
  }
  if (status === 'elevated') {
    return `Atenção Elevada em ${regionName}: tendência acumulada (${signed}) supera a faixa histórica normal. Intensificar monitoramento por satélite e prontidão da Defesa Civil.`;
  }
  return `Situação dentro da normalidade histórica em ${regionName} (${signed} vs. base MODIS). Manter monitoramento preventivo de rotina.`;
}

export const I18N = {
  pt: {
    subtitle: 'Harmonização MODIS (1km) + VIIRS (375m) via NASA FIRMS',
    both: 'Ambos',
    monthly: 'Mensal',
    weekly: 'Semanal',
    pitchBtn: 'Modo Pitch',
    methodologyBtn: 'Metodologia NASA',
    exportBtn: 'Exportar CSV',
    kpiHotspots: 'Focos Detectados (Mapa)',
    kpiHotspotsSub: (returned: number, sensorLabel: string) =>
      `Exibindo ${returned} pontos recentes (${sensorLabel})`,
    kpiFactor: 'Fator de Harmonização',
    kpiFactorSub: 'Converte contagem VIIRS (375m) para escala histórica MODIS (1km)',
    kpiAlert: 'Alerta do Último Período',
    kpiAlertSub: (period?: string) =>
      period ? `Período ${period} vs. média MODIS` : 'Aguardando série',
    kpiSource: 'Fonte de Dados',
    sourceLive: 'NASA FIRMS Ao Vivo',
    sourceFallback: 'CSV Local (Fallback)',
    syncing: 'Atualizando painel...',
    synced: 'Sincronizado',
    alertLabels: {
      normal: 'Normal',
      elevated: 'Elevado',
      critical: 'Crítico',
    } as Record<AlertLevel, string>,
    mapTitle: (region: string) => `Mapa de Focos de Calor — ${region}`,
    mapSubGrid: (cells: number) => `Grid espacial harmonizado (${cells} quadrantes ativos)`,
    mapSubPoints: 'Clique em qualquer ponto para ver satélite, horário e potência radiativa (FRP)',
    pointsBtn: 'Pontos',
    gridBtn: 'Grid Harmonizado',
    legendCrit: 'Quadrante Crítico',
    legendElev: 'Quadrante Elevado',
    legendNorm: 'Quadrante Normal',
    legendModis: 'MODIS (1km — série histórica)',
    legendViirs: 'VIIRS (375m — alta resolução)',
    popupQuadrant: 'Quadrante',
    popupCenter: 'Centro',
    popupRawModis: 'MODIS Bruto',
    popupRawViirs: 'VIIRS Bruto',
    popupNormViirs: 'VIIRS Normalizado',
    popupHarmIndex: 'Índice Harmonizado',
    popupAvgFrp: 'FRP Médio',
    popupSensor: 'Sensor',
    popupDate: 'Data',
    popupBrightness: 'Brilho',
    popupConfidence: 'Confiança',
    chartTitle: 'Calendário de Queimadas (MODIS ↔ VIIRS)',
    chartSubRaw: 'Comparação bruta: VIIRS parece muito maior só pela resolução de 375m',
    chartSubHarm: 'Série harmonizada na régua do MODIS vs. média histórica',
    btnShowHarm: 'Ver Harmonizado',
    btnShowRaw: 'Ver Dados Brutos',
    seriesModisRaw: 'MODIS Bruto (1km)',
    seriesViirsRaw: 'VIIRS Bruto (375m)',
    seriesModis: 'MODIS (1km)',
    seriesViirsNorm: 'VIIRS Normalizado (escala MODIS)',
    seriesHarmIndex: 'Índice Harmonizado',
    seriesHistAvg: 'Média Histórica MODIS',
    earlyWarningTitle: 'Diagnóstico de Alerta Precoce',
    ytdLabel: 'Acumulado',
    vsBase: 'vs. Base',
    peakLabel: 'Pico',
    proj60dLabel: 'Projeção 60d',
    projHigh: 'Tendência de Alta Crítica',
    projMod: 'Aceleração Moderada',
    projStable: 'Estável',
    matrixTitle: 'Matriz do Calendário (Série Temporal Harmonizada)',
    matrixSub:
      'Cada bloco compara o índice harmonizado (MODIS + VIIRS calibrado) contra a média histórica MODIS',
    harmLabel: 'Harmonizado',
    modisAvgLabel: 'Média MODIS',
    devLabel: 'Desvio',
    months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    navPanel: 'Painel',
    navMap: 'Mapa',
    navCalendar: 'Calendário',
    navAlerts: 'Alertas',
    navPitch: 'Pitch',
    modalTitle: 'Metodologia Científica: MODIS (1km) vs. VIIRS (375m)',
    modalIntro:
      'O desafio central do NASA Space Apps é evitar comparações distorcidas entre gerações diferentes de sensores orbitais sem perder os mais de 20 anos de série histórica do MODIS.',
    modalModisDesc:
      'Pixel maior (1 km × 1 km = 1,00 km²): um incêndio de médio porte costuma aparecer como 1 único foco. Série histórica de referência desde o ano 2000.',
    modalViirsDesc:
      'Pixel de 375 m × 375 m (0,14 km²) — cerca de 7× menor em área. O mesmo incêndio é fragmentado em 4 a 7 focos distintos.',
    modalFormulaTitle: 'Fórmula de Harmonização Aplicada no Backend:',
    modalFormulaNote: (factor: number) =>
      `O fator de calibração (× ${factor}) é estimado a partir dos períodos de sobreposição em que ambos os satélites observaram a mesma região, garantindo comparação justa com a média histórica MODIS.`,
    tourSteps: [
      {
        target: 'topbar',
        badge: 'Passo 1 de 5 — Controles & Dados NASA',
        title: 'Contexto & Fonte Ao Vivo (Amazônia / Manaus)',
        description:
          'Aqui selecionamos a região da Amazônia (com foco inicial em Manaus e Amazonas), filtramos os satélites MODIS (1 km) e VIIRS (375 m) da NASA FIRMS e acessamos metodologia e exportação CSV.',
      },
      {
        target: 'kpi-grid',
        badge: 'Passo 2 de 5 — Calibração Orbital',
        title: 'Calibração em Tempo Real',
        description:
          'Estes cartões resumem o total de focos recebidos da NASA, o fator matemático que converte VIIRS para a escala MODIS, o desvio do último período e o status da conexão ao vivo.',
      },
      {
        target: 'map-panel',
        badge: 'Passo 3 de 5 — Mapa Espacial',
        title: 'Pontos Individuais vs. Grid Harmonizado',
        description:
          'Em vez de tentar cruzar foco a foco, agrupamos os dois sensores em quadrantes geográficos (Grid Espacial). Alterne abaixo ao vivo para mostrar aos jurados onde estão as áreas críticas.',
      },
      {
        target: 'chart-panel',
        badge: 'Passo 4 de 5 — Calendário Comparativo',
        title: 'O Paradoxo MODIS (1 km) vs. VIIRS (375 m)',
        description:
          'Nos dados brutos, o VIIRS parece 4× maior só porque sua câmera é mais nítida. No modo harmonizado, ambos entram na mesma régua da média histórica MODIS — evitando falsos alarmes.',
      },
      {
        target: 'calendar-matrix',
        badge: 'Passo 5 de 5 — Alerta Precoce',
        title: 'Diagnóstico Anual & Projeção de 60 Dias',
        description:
          'A matriz mensal e a projeção de 60 dias mostram exatamente quando a curva foge do padrão histórico, orientando brigadistas e Defesa Civil antes do pico de agosto–setembro.',
      },
    ],
    tourPrev: 'Anterior',
    tourNext: 'Próximo',
    tourFinish: 'Finalizar Tour',
    tourViewPoints: 'Ver Pontos (Satélite)',
    tourViewGrid: 'Ver Grid Harmonizado',
    tourViewRaw: 'Ver Distorção (Brutos)',
    tourViewHarm: 'Ver Série Harmonizada',
    tourRecentHotspots: 'focos recentes',
    tourCalibFactor: 'Fator de calibração',
    tourYtdDev: 'desvio acumulado de',
    tourPeakIn: 'Pico em',
  },
  en: {
    subtitle: 'MODIS (1km) + VIIRS (375m) Harmonization via NASA FIRMS',
    both: 'Both',
    monthly: 'Monthly',
    weekly: 'Weekly',
    pitchBtn: 'Pitch Mode',
    methodologyBtn: 'NASA Methodology',
    exportBtn: 'Export CSV',
    kpiHotspots: 'Detected Hotspots (Map)',
    kpiHotspotsSub: (returned: number, sensorLabel: string) =>
      `Showing ${returned} recent hotspots (${sensorLabel})`,
    kpiFactor: 'Harmonization Factor',
    kpiFactorSub: 'Converts VIIRS (375m) counts to MODIS (1km) historical scale',
    kpiAlert: 'Latest Period Alert',
    kpiAlertSub: (period?: string) =>
      period ? `Period ${period} vs. MODIS average` : 'Awaiting series',
    kpiSource: 'Data Source',
    sourceLive: 'NASA FIRMS Live',
    sourceFallback: 'Local CSV (Fallback)',
    syncing: 'Updating dashboard...',
    synced: 'Synced',
    alertLabels: {
      normal: 'Normal',
      elevated: 'Elevated',
      critical: 'Critical',
    } as Record<AlertLevel, string>,
    mapTitle: (region: string) => `Thermal Hotspots Map — ${region}`,
    mapSubGrid: (cells: number) => `Harmonized spatial grid (${cells} active quadrants)`,
    mapSubPoints: 'Click any hotspot to inspect satellite, timestamp, and radiative power (FRP)',
    pointsBtn: 'Points',
    gridBtn: 'Harmonized Grid',
    legendCrit: 'Critical Quadrant',
    legendElev: 'Elevated Quadrant',
    legendNorm: 'Normal Quadrant',
    legendModis: 'MODIS (1km — historical baseline)',
    legendViirs: 'VIIRS (375m — high resolution)',
    popupQuadrant: 'Quadrant',
    popupCenter: 'Center',
    popupRawModis: 'Raw MODIS',
    popupRawViirs: 'Raw VIIRS',
    popupNormViirs: 'Normalized VIIRS',
    popupHarmIndex: 'Harmonized Index',
    popupAvgFrp: 'Avg FRP',
    popupSensor: 'Sensor',
    popupDate: 'Date',
    popupBrightness: 'Brightness',
    popupConfidence: 'Confidence',
    chartTitle: 'Fire Calendar (MODIS ↔ VIIRS)',
    chartSubRaw: 'Raw comparison: VIIRS looks inflated solely due to 375m resolution',
    chartSubHarm: 'Harmonized series on the MODIS ruler vs. historical baseline',
    btnShowHarm: 'View Harmonized',
    btnShowRaw: 'View Raw Data',
    seriesModisRaw: 'Raw MODIS (1km)',
    seriesViirsRaw: 'Raw VIIRS (375m)',
    seriesModis: 'MODIS (1km)',
    seriesViirsNorm: 'Normalized VIIRS (MODIS scale)',
    seriesHarmIndex: 'Harmonized Index',
    seriesHistAvg: 'MODIS Historical Avg',
    earlyWarningTitle: 'Early-Warning Diagnostic',
    ytdLabel: 'Cumulative',
    vsBase: 'vs. Baseline',
    peakLabel: 'Peak',
    proj60dLabel: '60d Outlook',
    projHigh: 'Critical Surge Trend',
    projMod: 'Moderate Acceleration',
    projStable: 'Stable',
    matrixTitle: 'Calendar Matrix (Harmonized Time Series)',
    matrixSub:
      'Each block compares the harmonized index (MODIS + calibrated VIIRS) against the MODIS historical average',
    harmLabel: 'Harmonized',
    modisAvgLabel: 'MODIS Avg',
    devLabel: 'Deviation',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    navPanel: 'Overview',
    navMap: 'Map',
    navCalendar: 'Calendar',
    navAlerts: 'Alerts',
    navPitch: 'Pitch',
    modalTitle: 'Scientific Methodology: MODIS (1km) vs. VIIRS (375m)',
    modalIntro:
      'The core NASA Space Apps challenge is preventing distorted comparisons across satellite sensor generations without losing over 20 years of MODIS historical records.',
    modalModisDesc:
      'Larger pixel (1 km × 1 km = 1.00 km²): a medium wildfire usually registers as 1 single hotspot. Reference archive since 2000.',
    modalViirsDesc:
      '375 m × 375 m pixel (0.14 km²) — roughly 7× smaller in area. The exact same fire splits into 4 to 7 distinct hotspots.',
    modalFormulaTitle: 'Harmonization Formula Applied in Backend:',
    modalFormulaNote: (factor: number) =>
      `The calibration factor (× ${factor}) is derived from overlapping periods observed by both satellites in the same region, enabling direct comparison against the MODIS historical average.`,
    tourSteps: [
      {
        target: 'topbar',
        badge: 'Step 1 of 5 — Controls & NASA Data',
        title: 'Context & Live Feed (Amazon / Manaus)',
        description:
          'Select Amazon sub-regions (focused on Manaus and Amazonas), filter MODIS (1 km) and VIIRS (375 m) sensors from NASA FIRMS, switch languages, and export CSV reports.',
      },
      {
        target: 'kpi-grid',
        badge: 'Step 2 of 5 — Orbital Calibration',
        title: 'Real-Time Calibration Metrics',
        description:
          'These cards summarize total hotspots fetched from NASA, the mathematical calibration factor converting VIIRS to MODIS scale, latest deviation, and live API status.',
      },
      {
        target: 'map-panel',
        badge: 'Step 3 of 5 — Spatial Map',
        title: 'Individual Hotspots vs. Harmonized Grid',
        description:
          'Instead of matching point-by-point, we aggregate both sensors into geographic grid cells. Switch live below to show judges where critical density quadrants are located.',
      },
      {
        target: 'chart-panel',
        badge: 'Step 4 of 5 — Comparative Calendar',
        title: 'The MODIS (1 km) vs. VIIRS (375 m) Paradox',
        description:
          'In raw counts, VIIRS looks ~4× larger simply due to sharper pixel resolution. Harmonization puts both sensors on the same 20-year MODIS baseline to eliminate false alarms.',
      },
      {
        target: 'calendar-matrix',
        badge: 'Step 5 of 5 — Early Warning',
        title: 'Annual Matrix & 60-Day Risk Outlook',
        description:
          'The monthly matrix and 60-day trend signal exactly when fire activity breaks away from historical norms, guiding brigades and Civil Defense ahead of the Aug–Sep peak.',
      },
    ],
    tourPrev: 'Previous',
    tourNext: 'Next',
    tourFinish: 'Finish Tour',
    tourViewPoints: 'View Points (Satellite)',
    tourViewGrid: 'View Harmonized Grid',
    tourViewRaw: 'View Raw Distortion',
    tourViewHarm: 'View Harmonized Series',
    tourRecentHotspots: 'recent hotspots',
    tourCalibFactor: 'Calibration factor',
    tourYtdDev: 'cumulative deviation of',
    tourPeakIn: 'Peak in',
  },
} as const;
