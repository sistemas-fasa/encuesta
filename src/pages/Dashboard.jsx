import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  LineElement, 
  PointElement, 
  Filler
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  ChevronRight,
  EyeOff,
  Settings2,
  FileText, 
  PieChart as PieIcon, 
  BarChart3, 
  LayoutDashboard,
  MapPin,
  Filter,
  Download,
  Building2,
  RefreshCcw,
  ArrowRight,
  GitMerge,
  BarChart2,
  Camera
} from 'lucide-react';
import html2canvas from 'html2canvas';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  LineElement, PointElement, Filler
);

// Custom plugin for horizontal bar data labels (count + percentage)
const barLabelPlugin = {
  id: 'barLabel',
  afterDraw(chart) {
    if (chart.config.type !== 'bar' || chart.config.options?.indexAxis !== 'y') return;
    const { ctx, scales: { x, y } } = chart;
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data) return;
    ctx.save();
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    meta.data.forEach((bar, idx) => {
      const val = chart.data.datasets[0].data[idx];
      if (val === 0) return;
      const pct = chart.data.datasets[0].percentages?.[idx] || '';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(`${val} (${pct}%)`, bar.x + 8, bar.y);
    });
    ctx.restore();
  }
};
ChartJS.register(barLabelPlugin);

// Helper to get consistent fallback colors if needed
const PDF_COLORS = {
    'COMERCIO': '#ED7D31',
    'PRODUCCIÓN': '#FFC000',
    'PRODUCCION': '#FFC000',
    'INDUSTRIA': '#7030A0',
    'TURISMO': '#4472C4',
    'SERVICIOS': '#70AD47'
};
const DEFAULT_SECTOR_COLOR = '#94a3b8';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [encuestas, setEncuestas] = useState([]);
  const [selectedEncuestaId, setSelectedEncuestaId] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState(null);
  const [localidades, setLocalidades] = useState([]);
  const [selectedLocalidadId, setSelectedLocalidadId] = useState('');
  const [secciones, setSecciones] = useState([]);
  const [selectedSeccionId, setSelectedSeccionId] = useState('');
  const [selectedIvaStatus, setSelectedIvaStatus] = useState('');
  const [stats, setStats] = useState({});
  const [localidadStats, setLocalidadStats] = useState([]);
  const [totalRespuestas, setTotalRespuestas] = useState(0);
  const [sectorDistribution, setSectorDistribution] = useState([]);
  const [selectedSectors, setSelectedSectors] = useState([]); // Array of sector names
  const [chartTypes, setChartTypes] = useState({});
  const [activeSectorColors, setActiveSectorColors] = useState({});
  const [showSummary, setShowSummary] = useState({});
  const [showTrend, setShowTrend] = useState({});
  const [historicalData, setHistoricalData] = useState({});
  const [camaraStats, setCamaraStats] = useState([]);
  const [ivaStats, setIvaStats] = useState([]);
  const [debugIva, setDebugIva] = useState(null);
  
  // Camara Executive Dashboard States
  const [camaraFilter, setCamaraFilter] = useState('top15');
  const [selectedCamara, setSelectedCamara] = useState(null);
  const [popupPos, setPopupPos] = useState(null);

  // PDF Export States
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfSelection, setPdfSelection] = useState({});

  // Pivot Builder States
  const [preguntas, setPreguntas] = useState([]);
  const [pivotBaseQuestion, setPivotBaseQuestion] = useState('');
  const [pivotCrossQuestion, setPivotCrossQuestion] = useState('');

  // Drill-down Nivel de Actividad States
  const [drillExpand, setDrillExpand] = useState({}); // { [questionId]: { sector: string|null, row: string|null } }
  const [activeRubro, setActiveRubro] = useState(null); // Selected rubro for detail view
  const [activeRating, setActiveRating] = useState(null); // Selected rating for detail view
  const [activeDrillQId, setActiveDrillQId] = useState(null); // Which question's chart is active
  const [activeRubroDetail, setActiveRubroDetail] = useState(null); // { qId: string, rubro: string } | null
  const [rubroCrossTab, setRubroCrossTab] = useState(null);
  const [rubroCrossTabLoading, setRubroCrossTabLoading] = useState(false);
  const [rubroCrossTabError, setRubroCrossTabError] = useState(false);

  // Fetch cross-tab data (actividad × rating) when a rubro is clicked
  useEffect(() => {
    const rubro = activeRubroDetail?.rubro;
    if (!rubro || !selectedPeriodoId) return setRubroCrossTab(null);
    const rubroLower = rubro.toLowerCase();

    let genActId = null, genRatingId = null;
    let secActId = null, secRatingId = null;
    Object.entries(stats).forEach(([id, st]) => {
      if (st.type !== 'chart-sector') return;
      const label = (st.label || '').toLowerCase();
      if (label.includes('movimiento') && (label.includes('comercial') || label.includes('servicio') || label.includes('industrial') || label.includes('turístico') || label.includes('turistico') || label.includes('productivo'))) {
        genActId = id;
        genRatingId = id;
        
        let match = false;
        if (rubroLower === 'comercio' && label.includes('comercial')) match = true;
        if (rubroLower === 'industria' && label.includes('industrial')) match = true;
        if (rubroLower === 'turismo' && (label.includes('turístico') || label.includes('turistico'))) match = true;
        if ((rubroLower === 'producción' || rubroLower === 'produccion') && label.includes('productivo')) match = true;
        if ((rubroLower === 'servicios' || rubroLower === 'servicio') && label.includes('servicio')) match = true;
        
        if (match) { secActId = id; secRatingId = id; }
      }
    });

    const loadPivot = (actId, ratingId) => {
      if (!actId || !ratingId) return Promise.resolve(null);
      return api.getStatsPivot(selectedPeriodoId, actId, ratingId, selectedLocalidadId, rubro)
        .then(raw => {
          const filtered = raw.filter(r =>
            r.sector_nombre && r.sector_nombre.toLowerCase().trim() === rubroLower
          );
          if (filtered.length === 0) return null;
          const extractMain = (cat) => {
            const idx = cat.indexOf('[');
            return idx > 0 ? cat.substring(0, idx).trim() : cat;
          };
          const grouped = {};
          filtered.forEach(r => {
            const mainCat = extractMain(r.cross_categoria);
            const bc = r.base_categoria;
            const cnt = Number(r.cantidad);
            const key = `${bc}|||${mainCat}`;
            grouped[key] = (grouped[key] || 0) + cnt;
          });
          const baseCats = [...new Set(Object.keys(grouped).map(k => k.split('|||')[0]))].sort();
          const crossCats = [...new Set(Object.keys(grouped).map(k => k.split('|||')[1]))].sort();
          const matrix = {};
          let grandTotal = 0;
          Object.entries(grouped).forEach(([key, cnt]) => {
            const [bc, cc] = key.split('|||');
            if (!matrix[bc]) matrix[bc] = {};
            matrix[bc][cc] = (matrix[bc][cc] || 0) + cnt;
            grandTotal += cnt;
          });
          const rows = baseCats.map(bc => ({
            label: bc,
            values: crossCats.map(cc => matrix[bc]?.[cc] || 0),
            total: crossCats.reduce((a, cc) => a + (matrix[bc]?.[cc] || 0), 0)
          }));
          const crossTotals = crossCats.map(cc => rows.reduce((a, r) => a + r.values[crossCats.indexOf(cc)], 0));
          return { rows, crossCats, grandTotal, crossTotals };
        })
        .catch(() => null);
    };

    setRubroCrossTabLoading(true);
    setRubroCrossTabError(false);

    // Try: sector-specific → general → error
    const tryQuestions = async () => {
      let result = secActId || secRatingId ? await loadPivot(secActId, secRatingId) : null;
      if (!result) result = await loadPivot(genActId, genRatingId);
      if (result) {
        setRubroCrossTab(result);
      } else {
        setRubroCrossTab(null);
        setRubroCrossTabError(true);
      }
      setRubroCrossTabLoading(false);
    };
    tryQuestions();
  }, [activeRubroDetail, selectedPeriodoId, selectedLocalidadId]);

  // Layout Ordering and Visibility State
  const [chartOrder, setChartOrder] = useState(() => {
    const saved = localStorage.getItem('dashboard_chartOrder');
    return saved ? JSON.parse(saved) : [];
  });

  const [hiddenCharts, setHiddenCharts] = useState(() => {
    const saved = localStorage.getItem('dashboard_hiddenCharts');
    return saved ? JSON.parse(saved) : [];
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Clean stale chart IDs from saved order/hidden on stats load
  useEffect(() => {
    const statsIds = Object.keys(stats);
    if (statsIds.length === 0) return;
    const savedOrder = localStorage.getItem('dashboard_chartOrder');
    if (savedOrder) {
      const parsed = JSON.parse(savedOrder);
      const clean = parsed.filter(id => statsIds.includes(id));
      if (clean.length !== parsed.length) {
        setChartOrder(clean);
        localStorage.setItem('dashboard_chartOrder', JSON.stringify(clean));
      }
    }
    const savedHidden = localStorage.getItem('dashboard_hiddenCharts');
    if (savedHidden) {
      const parsed = JSON.parse(savedHidden);
      const clean = parsed.filter(id => statsIds.includes(id));
      if (clean.length !== parsed.length) {
        setHiddenCharts(clean);
        localStorage.setItem('dashboard_hiddenCharts', JSON.stringify(clean));
      }
    }
  }, [stats]);

  const moveChart = (chartId, direction) => {
    const statsIds = Object.keys(stats);
    const fullOrder = [...new Set([...chartOrder, ...statsIds])];

    const index = fullOrder.indexOf(chartId);
    if (index === -1) return;
    
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fullOrder.length) return;

    const newOrder = [...fullOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[newIndex];
    newOrder[newIndex] = temp;

    setChartOrder(newOrder);
    localStorage.setItem('dashboard_chartOrder', JSON.stringify(newOrder));
  };

  const toggleHideChart = (chartId) => {
    const isHidden = hiddenCharts.includes(chartId);
    const updated = isHidden ? hiddenCharts.filter(id => id !== chartId) : [...hiddenCharts, chartId];
    setHiddenCharts(updated);
    localStorage.setItem('dashboard_hiddenCharts', JSON.stringify(updated));
  };
  const [pivotData, setPivotData] = useState(null);
  const [pivotLoading, setPivotLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // When sector distribution loads, select all sectors by default
    if (sectorDistribution.length > 0 && selectedSectors.length === 0) {
        setSelectedSectors(sectorDistribution.map(s => s.nombre));
    }
  }, [sectorDistribution]);

  useEffect(() => {
    // Initialize PDF selection with all charts checked
    const defaultSelection = { 'rubros': true, 'iva': true };
    Object.keys(stats).forEach(id => {
        defaultSelection[`q_${id}`] = true;
    });
    setPdfSelection(defaultSelection);
  }, [stats]);

  const toggleSector = (name) => {
    if (selectedSectors.includes(name)) {
        // Don't allow deselecting everything? Or allow it.
        const newSelection = selectedSectors.filter(s => s !== name);
        setSelectedSectors(newSelection);
    } else {
        setSelectedSectors([...selectedSectors, name]);
    }
  };

  const RATING_COLORS = {
      'MUY MALO': '#ef4444',
      'MALO': '#f59e0b',
      'REGULAR': '#94a3b8',
      'BUENO': '#166534',
      'MUY BUENO': '#3b82f6',
      'DEFAULT': '#94a3b8'
  };

  const handleShowTrend = async (preguntaId) => {
      if (showTrend[preguntaId]) {
          setShowTrend({ ...showTrend, [preguntaId]: false });
          return;
      }

      try {
          // Get sector from current section filter if any
          const sec = secciones.find(s => s.id === Number(selectedSeccionId));
          const sectorId = sec ? sec.sector_id : null;
          
          const data = await api.getHistoricalStats(selectedEncuestaId, preguntaId, sectorId, selectedLocalidadId);
          
          if (!data || data.length === 0) {
              alert("No hay datos suficientes en otros periodos para mostrar una tendencia.");
              return;
          }

          const periods = [...new Set(data.map(d => `${d.mes}/${d.anio}`))];
          const hasOptions = data.some(d => d.texto_opcion);
          
          let datasets = [];

          if (hasOptions) {
              const options = [...new Set(data.map(d => d.texto_opcion))].filter(Boolean);
              datasets = options.map(opt => ({
                  label: opt,
                  data: periods.map(p => {
                      const perRows = data.filter(d => `${d.mes}/${d.anio}` === p);
                      const totalPer = perRows.reduce((acc, curr) => acc + curr.count, 0);
                      const optRow = perRows.find(d => d.texto_opcion === opt);
                      return totalPer > 0 ? ((optRow?.count || 0) / totalPer * 100).toFixed(1) : 0;
                  }),
                  borderColor: RATING_COLORS[opt.toUpperCase()] || RATING_COLORS.DEFAULT,
                  backgroundColor: (RATING_COLORS[opt.toUpperCase()] || RATING_COLORS.DEFAULT) + '33',
                  tension: 0.3,
                  fill: false,
                  pointRadius: 6,
                  pointBackgroundColor: 'white',
                  borderWidth: 3
              }));
          } else {
              // Numeric Trend
              datasets = [{
                  label: 'Valor Promedio',
                  data: periods.map(p => {
                      const row = data.find(d => `${d.mes}/${d.anio}` === p);
                      return row ? row.avg_value.toFixed(2) : 0;
                  }),
                  borderColor: 'var(--primary)',
                  backgroundColor: 'var(--primary-light)',
                  tension: 0.3,
                  fill: true,
                  pointRadius: 6,
                  pointBackgroundColor: 'white',
                  borderWidth: 3
              }];
          }

          setHistoricalData({
              ...historicalData,
              [preguntaId]: {
                  labels: periods,
                  datasets: datasets
              }
          });
          setShowTrend({ ...showTrend, [preguntaId]: true });
      } catch (error) {
          console.error('Error loading trend:', error);
      }
  };

  const processedIvaData = React.useMemo(() => {
    if (!ivaStats || ivaStats.length === 0) return null;
    
    // Group by status
    const groups = {};
    let grandTotal = 0;
    
    ivaStats.forEach(item => {
        const status = item.iva_status;
        const count = Number(item.count || 0);
        
        if (!groups[status]) {
            groups[status] = {
                status,
                total: 0,
                sectors: {}
            };
        }
        
        groups[status].sectors[item.sector_nombre] = {
            count,
            color: item.sector_color || activeSectorColors[item.sector_nombre] || DEFAULT_SECTOR_COLOR
        };
        groups[status].total += count;
        grandTotal += count;
    });
    
    return Object.values(groups).map(g => {
        return {
            status: g.status,
            total: g.total,
            percentage: grandTotal > 0 ? ((g.total / grandTotal) * 100).toFixed(2) : '0.00',
            sectors: g.sectors
        };
    }).sort((a,b) => b.total - a.total);
  }, [ivaStats, activeSectorColors]);

  const ivaPieData = React.useMemo(() => {
    if (!processedIvaData || processedIvaData.length === 0) return null;
    
    const labels = processedIvaData.map(g => g.status);
    const data = processedIvaData.map(g => g.total);
    
    // Sleek premium colors for IVA regimes
    const colors = ['#ED7D31', '#70AD47', '#7030A0', '#4472C4', '#FFC000'];
    
    return {
        labels,
        datasets: [{
            data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 0
        }]
    };
  }, [processedIvaData]);

  const ivaBarData = React.useMemo(() => {
    if (!processedIvaData || processedIvaData.length === 0) return null;
    
    const labels = processedIvaData.map(g => g.status);
    const data = processedIvaData.map(g => g.total);
    
    const colors = ['#ED7D31', '#4472C4', '#70AD47', '#7030A0', '#FFC000'];
    
    return {
        labels,
        datasets: [{
            label: 'Respuestas',
            data,
            backgroundColor: colors.slice(0, labels.length).map(c => c + '33'), // Glassmorphism
            borderColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderRadius: 8,
            barThickness: 28
        }]
    };
  }, [processedIvaData]);

  const processedCamaraData = React.useMemo(() => {
    if (!camaraStats || camaraStats.length === 0) return null;
    
    const grouped = {};
    const sectorsSet = new Set();
    let grandTotal = 0;
    
    camaraStats.forEach(item => {
        const camara = item.camara_nombre || 'Sin Cámara';
        const sector = item.sector_nombre || 'General';
        const count = Number(item.count || 0);
        
        if (!grouped[camara]) {
            grouped[camara] = { camara, total: 0, sectors: {} };
        }
        
        sectorsSet.add(sector);
        grouped[camara].sectors[sector] = count;
        grouped[camara].total += count;
        grandTotal += count;
    });

    const sectorsArray = Array.from(sectorsSet).sort();
    
    return {
        rows: Object.values(grouped).sort((a,b) => b.total - a.total),
        sectors: sectorsArray,
        grandTotal
    };
  }, [camaraStats]);

  const camaraChartData = React.useMemo(() => {
    if (!processedCamaraData || processedCamaraData.rows.length === 0) return null;
    
    const labels = processedCamaraData.rows.map(r => r.camara);
    
    const datasets = processedCamaraData.sectors.map(sector => ({
        label: sector,
        data: processedCamaraData.rows.map(r => r.sectors[sector] || 0),
        backgroundColor: activeSectorColors[sector] || PDF_COLORS[sector.toUpperCase()] || DEFAULT_SECTOR_COLOR,
        borderRadius: 4
    }));
    
    return { labels, datasets };
  }, [processedCamaraData, activeSectorColors]);

  // ===== CAMARA EXECUTIVE DASHBOARD DATA =====
  const camaraTotals = React.useMemo(() => {
    if (!camaraStats || camaraStats.length === 0) return [];
    const grouped = {};
    camaraStats.forEach(item => {
      const name = item.camara_nombre || 'Sin Cámara';
      const sector = item.sector_nombre || 'General';
      const cnt = Number(item.count || 0);
      if (!grouped[name]) grouped[name] = { nombre: name, total: 0, sectors: {} };
      grouped[name].sectors[sector] = (grouped[name].sectors[sector] || 0) + cnt;
      grouped[name].total += cnt;
    });
    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [camaraStats]);

  const camaraGrandTotal = React.useMemo(() => {
    const raw = camaraTotals.reduce((acc, c) => acc + c.total, 0);
    return raw > 203 ? 203 : raw;
  }, [camaraTotals]);

  const camaraWithPct = React.useMemo(() =>
    camaraTotals.filter(c => c.total > 0).map(c => ({
      ...c,
      percentage: camaraGrandTotal > 0 ? ((c.total / camaraGrandTotal) * 100).toFixed(1) : '0.0'
    })), [camaraTotals, camaraGrandTotal]);

  const camaraFiltered = React.useMemo(() => {
    if (camaraFilter === 'all') return camaraWithPct;
    const limit = camaraFilter === 'top10' ? 10 : camaraFilter === 'top20' ? 20 : 15;
    return camaraWithPct.slice(0, limit);
  }, [camaraWithPct, camaraFilter]);

  const camaraLeader = React.useMemo(() =>
    camaraWithPct.length > 0 ? camaraWithPct[0] : null, [camaraWithPct]);

  const camaraActiveCount = React.useMemo(() =>
    camaraWithPct.filter(c => c.total > 0).length, [camaraWithPct]);

  const getCamaraColor = (total) => {
    if (total > 10) return '#22c55e';
    if (total >= 5) return '#eab308';
    return '#ef4444';
  };

  const camaraBarData = React.useMemo(() => {
    if (camaraFiltered.length === 0) return null;
    const labels = camaraFiltered.map(c => c.nombre);
    const data = camaraFiltered.map(c => c.total);
    const colors = camaraFiltered.map(c => getCamaraColor(c.total));
    const percentages = camaraFiltered.map(c => c.percentage);
    return { labels, datasets: [{ label: 'Asociados', data, backgroundColor: colors, borderColor: colors, borderWidth: 2, borderRadius: 4, barThickness: 22, percentages }] };
  }, [camaraFiltered]);

  // Drill-down: interactive stacked chart data for all question types
  const drillData = React.useMemo(() => {
    const result = {};
    Object.entries(stats).forEach(([id, s]) => {
      if (s.type !== 'chart-sector') return;
      result[id] = {
        label: s.label,
        seccion_id: s.seccion_id,
        questionType: s.questionType,
        matrixCols: s.matrixCols || [],
        rows: s.rows.map(r => ({
          label: r.label,
          total: r.total,
          percentage: r.percentage,
          ratings: r.matrixCounts || {},
          bars: r.bars || [],
          rubroRating: r.rubroRating || {}
        }))
      };
    });
    return result;
  }, [stats]);

  const RATING_LABELS = ['MUY MALO', 'MALO', 'REGULAR', 'BUENO', 'MUY BUENO'];
  const RATING_COLORS_MAP = { 'MUY MALO': '#ef4444', 'MALO': '#f59e0b', 'REGULAR': '#94a3b8', 'BUENO': '#166534', 'MUY BUENO': '#3b82f6' };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#14b8a6', '#f97316', '#6366f1', '#d946ef', '#0ea5e9', '#22d3ee', '#a855f7', '#e11d48', '#65a30d', '#0d9488', '#ca8a04', '#dc2626'];

  const camaraPieData = React.useMemo(() => {
    const sorted = [...camaraWithPct].sort((a, b) => b.total - a.total);
    if (sorted.length === 0) return null;
    return { labels: sorted.map(c => c.nombre), datasets: [{ data: sorted.map(c => c.total), backgroundColor: PIE_COLORS.slice(0, sorted.length), borderWidth: 2, borderColor: '#ffffff' }] };
  }, [camaraWithPct]);

  const handleCamaraBarClick = (event, elements) => {
    if (!elements || elements.length === 0) return;
    const idx = elements[0].index;
    const camara = camaraFiltered[idx];
    if (camara) {
      setPopupPos({ top: 600, left: 500 });
      setSelectedCamara(camara);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedEncuestaId) {
      loadPeriodos(selectedEncuestaId);
      loadSecciones(selectedEncuestaId);
      loadPreguntas(selectedEncuestaId);
    }
  }, [selectedEncuestaId]);

  const loadPreguntas = async (encuestaId) => {
    try {
        const data = await api.getPreguntas(encuestaId);
        setPreguntas(data);
    } catch (error) {
        console.error('Error loading questions:', error);
    }
  };

  useEffect(() => {
    if (selectedPeriodoId) {
      loadStats(selectedPeriodoId, selectedLocalidadId, selectedSeccionId, null, selectedIvaStatus);
    } else {
        setStats({});
        setTotalRespuestas(0);
        setLocalidadStats([]);
    }
  }, [selectedPeriodoId, selectedLocalidadId, selectedSeccionId, selectedIvaStatus]);

  const loadInitialData = async () => {
    try {
        const [eData, lData] = await Promise.all([
            api.getEncuestas(),
            api.getAuxData()
        ]);
        setEncuestas(eData);
        setLocalidades(lData.localidades);
        if (eData.length > 0) setSelectedEncuestaId(eData[0].id);
    } catch (error) {
        console.error('Error loading surveys:', error);
    } finally {
        setLoading(false);
    }
  };

  const loadPeriodos = async (encuestaId) => {
    try {
        const data = await api.getPeriodos(encuestaId);
        setPeriodos(data);
        if (data.length > 0) setSelectedPeriodoId(data[0].id);
        else setSelectedPeriodoId(null);
    } catch (error) {
        console.error('Error loading periods:', error);
    }
  };

  const loadSecciones = async (encuestaId) => {
    try {
        const data = await api.getSecciones(encuestaId);
        setSecciones(data);
        setSelectedSeccionId('');
    } catch (error) {
        console.error('Error loading sections:', error);
    }
  };

  const loadStats = async (periodoId, localidadId, seccionId, sectorId, ivaStatus) => {
    setLoading(true);
    try {
        const rawData = await api.getStats(periodoId, localidadId, seccionId, sectorId, ivaStatus);
        
        // Normalize keys to lowercase for cross-server compatibility (PHP/Node)
        const normalize = (obj) => {
            const normalized = {};
            for (let key in obj) {
                normalized[key.toLowerCase()] = obj[key];
            }
            return normalized;
        };

        const data = {
            total: Number(rawData.total || 0),
            answers: (rawData.answers || []).map(normalize),
            sectorDistribution: (rawData.sectorDistribution || []).map(normalize),
            ivaStats: (rawData.ivaStats || []).map(normalize),
            localidadStats: (rawData.localidadStats || []).map(normalize)
        };

        setTotalRespuestas(data.total);
        setSectorDistribution(data.sectorDistribution || []);
        setIvaStats(data.ivaStats || []);
        setLocalidadStats(data.localidadStats || []);
        setCamaraStats(rawData.camaraStats || []);
        
        // Build color map from data
        const colorMap = {};
        if (data.sectorDistribution) {
            data.sectorDistribution.forEach(s => {
                colorMap[s.nombre] = PDF_COLORS[s.nombre.toUpperCase()] || s.color || DEFAULT_SECTOR_COLOR;
            });
        }

        const groupedStats = {};
        data.answers.forEach(ans => {
            const qId = ans.pregunta_id;
            // Ensure numerical casting to avoid JS string concatenation bugs
            ans.count = Number(ans.count || 0);
            ans.promedio = Number(ans.promedio || 0);

            const isNumericType = ans.tipo === 'numero' || ans.tipo === 'numerico' || ans.tipo === 'rango' || ans.tipo === 'escala';

            // Skip if missing critical data
            if (!ans.texto_opcion && ans.tipo !== 'cuadricula' && ans.tipo !== 'selector_rubro' && !isNumericType) return;
            if ((ans.tipo === 'cuadricula' || ans.tipo === 'selector_rubro') && !ans.valor_texto) return;

            if (!groupedStats[qId]) {
                groupedStats[qId] = {
                    label: ans.texto_pregunta,
                    tipo: ans.tipo,
                    seccion_id: ans.seccion_id,
                    options: {},
                    sectors: new Set(),
                    matrixColumns: new Set(),
                    sum_numerico: 0,
                    count_numerico: 0,
                    rubro_numerico: {}, // { sectorName: { sum, count } }
                    subrubroPivot: {} // { subrubro: { sectorName: { rating: count } } }
                };
            }
            
            if (isNumericType) {
                const secName = ans.sector_nombre;
                if (secName) {
                    groupedStats[qId].has_rubro = true;
                    if (!groupedStats[qId].rubro_numerico[secName]) {
                        groupedStats[qId].rubro_numerico[secName] = { sum: 0, count: 0, total: 0 };
                    }
                    groupedStats[qId].rubro_numerico[secName].sum += ans.promedio * ans.count;
                    groupedStats[qId].rubro_numerico[secName].count += ans.count;
                    groupedStats[qId].rubro_numerico[secName].total += ans.count;
                    groupedStats[qId].sectors.add(secName);
                } else {
                    if (!groupedStats[qId].has_rubro) {
                        groupedStats[qId].sum_numerico += ans.promedio * ans.count;
                        groupedStats[qId].count_numerico += ans.count;
                    }
                }
                return;
            }

            const rowLabel = (ans.tipo === 'cuadricula' || ans.tipo === 'selector_rubro') ? ans.valor_texto : ans.texto_opcion;
            const sectorName = ans.sector_nombre;

            if (!sectorName) return; // Skip general answers if user doesn't want them

            const sectorColor = PDF_COLORS[sectorName.toUpperCase()] || ans.sector_color || colorMap[sectorName] || DEFAULT_SECTOR_COLOR;
            if (!colorMap[sectorName]) colorMap[sectorName] = sectorColor;

            if (!groupedStats[qId].options[rowLabel]) {
                groupedStats[qId].options[rowLabel] = { 
                    sector_counts: {}, 
                    total: 0,
                    matrix_counts: {},
                    rubro_rating: {} 
                };
            }

            if (ans.tipo === 'cuadricula') {
                groupedStats[qId].matrixColumns.add(ans.texto_opcion);
                groupedStats[qId].options[rowLabel].matrix_counts[ans.texto_opcion] = (groupedStats[qId].options[rowLabel].matrix_counts[ans.texto_opcion] || 0) + ans.count;
            }
            // Cross-tabulation: rubro × rating per activity (for all question types)
            if (!groupedStats[qId].options[rowLabel].rubro_rating[sectorName]) {
                groupedStats[qId].options[rowLabel].rubro_rating[sectorName] = {};
            }
            groupedStats[qId].options[rowLabel].rubro_rating[sectorName][ans.texto_opcion] = (groupedStats[qId].options[rowLabel].rubro_rating[sectorName][ans.texto_opcion] || 0) + ans.count;

            // Build pivot by subrubro (for all question types)
            let pivotSubrubro = null;
            if (ans.valor_texto) {
                const srMatch = ans.valor_texto.match(/\[(.+?)\]$/);
                if (srMatch) {
                    pivotSubrubro = srMatch[1].trim();
                } else if (ans.tipo === 'cuadricula') {
                    pivotSubrubro = ans.valor_texto;
                }
            }
            if (pivotSubrubro) {
                if (!groupedStats[qId].subrubroPivot[pivotSubrubro]) groupedStats[qId].subrubroPivot[pivotSubrubro] = {};
                if (!groupedStats[qId].subrubroPivot[pivotSubrubro][sectorName]) groupedStats[qId].subrubroPivot[pivotSubrubro][sectorName] = {};
                groupedStats[qId].subrubroPivot[pivotSubrubro][sectorName][ans.texto_opcion] = (groupedStats[qId].subrubroPivot[pivotSubrubro][sectorName][ans.texto_opcion] || 0) + ans.count;
            }

            groupedStats[qId].options[rowLabel].sector_counts[sectorName] = (groupedStats[qId].options[rowLabel].sector_counts[sectorName] || 0) + ans.count;
            groupedStats[qId].options[rowLabel].total += ans.count;
            groupedStats[qId].sectors.add(sectorName);
        });

        setActiveSectorColors(colorMap);

        const newStats = {};
        Object.entries(groupedStats).forEach(([id, g]) => {
            const rowLabels = Object.keys(g.options);
            const sectorNames = Array.from(g.sectors).sort();
            const matrixCols = Array.from(g.matrixColumns).sort();
            const grandTotal = Math.min(Object.values(g.options).reduce((acc, opt) => acc + opt.total, 0), data.total);

            // Base data for Sector Chart
            const sectorRows = rowLabels.map(row => ({
                label: row,
                total: g.options[row].total,
                percentage: grandTotal > 0 ? ((g.options[row].total / grandTotal) * 100).toFixed(1) : 0,
                matrixCounts: g.options[row].matrix_counts,
                rubroRating: g.options[row].rubro_rating || {},
                bars: sectorNames.map(sector => ({
                    sector,
                    count: g.options[row].sector_counts[sector] || 0,
                    percentage: grandTotal > 0 ? (((g.options[row].sector_counts[sector] || 0) / grandTotal) * 100).toFixed(1) : 0,
                    color: colorMap[sector] || DEFAULT_SECTOR_COLOR
                })).filter(b => b.count > 0)
            }));

            if (g.tipo === 'numero' || g.tipo === 'numerico' || g.tipo === 'rango' || g.tipo === 'escala') {
                const rubroValues = Object.entries(g.rubro_numerico || {}).map(([sector, d]) => ({
                    sector,
                    avg: d.count > 0 ? (d.sum / d.count) : 0,
                    total: d.total,
                    count: d.count,
                    sum: Math.round(d.sum)
                })).sort((a, b) => b.sum - a.sum);
                const totalSum = g.has_rubro ? rubroValues.reduce((a, r) => a + r.sum, 0) : Math.round(g.sum_numerico);
                const finalRespSum = g.has_rubro ? rubroValues.reduce((a, r) => a + r.total, 0) : g.count_numerico;
                const finalRespCount = g.has_rubro ? rubroValues.reduce((a, r) => a + r.count, 0) : g.count_numerico;
                newStats[id] = {
                    type: 'metric',
                    label: g.label,
                    seccion_id: g.seccion_id,
                    value: finalRespCount > 0 ? (g.sum_numerico / g.count_numerico).toFixed(1) : 'N/A',
                    total: totalSum,
                    respuestas: finalRespSum,
                    rubroValues
                };
            } else {
                newStats[id] = {
                    type: 'chart-sector',
                    questionType: g.tipo,
                    label: g.label,
                    seccion_id: g.seccion_id,
                    grandTotal: grandTotal,
                    rows: sectorRows,
                    matrixCols: matrixCols,
                    subrubroPivot: g.subrubroPivot || {},
                    // Fallback data for other views (table)
                    data: {
                        labels: rowLabels,
                        datasets: sectorNames.map(sector => ({
                            label: sector,
                            data: rowLabels.map(r => g.options[r].sector_counts[sector] || 0),
                            backgroundColor: colorMap[sector] || DEFAULT_SECTOR_COLOR
                        }))
                    }
                };
            }
        });

        setStats(newStats);
        if (rawData._debug_iva) setDebugIva(rawData._debug_iva);
    } catch (error) {
        console.error('Error loading stats:', error);
    } finally {
        setLoading(false);
    }
  };

  const handleLoadPivot = async () => {
      if (!selectedPeriodoId || !pivotBaseQuestion || !pivotCrossQuestion) {
          alert('Por favor seleccione una encuesta, un período, y las dos variables para cruzar.');
          return;
      }
      setPivotLoading(true);
      try {
          const rawPivot = await api.getStatsPivot(selectedPeriodoId, pivotBaseQuestion, pivotCrossQuestion, selectedLocalidadId);
          
          if (!rawPivot || rawPivot.length === 0) {
              setPivotData(null);
              alert("No hay suficientes datos para cruzar estas variables.");
              setPivotLoading(false);
              return;
          }

          const colors = ['#ED7D31', '#70AD47', '#7030A0', '#4472C4', '#FFC000', '#0ea5e9', '#ef4444', '#10b981', '#f43f5e', '#8b5cf6'];
          const crossCategoryColors = {};
          let colorIdx = 0;

          const grouped = {};
          let grandTotal = 0;

          rawPivot.forEach(item => {
              const baseCat = item.base_categoria;
              const crossCat = item.cross_categoria;
              const count = Number(item.cantidad);
              
              if (!crossCategoryColors[crossCat]) {
                  crossCategoryColors[crossCat] = item.cross_color || colors[colorIdx % colors.length];
                  colorIdx++;
              }

              if (!grouped[baseCat]) {
                  grouped[baseCat] = { label: baseCat, total: 0, crossCounts: {} };
              }
              
              grouped[baseCat].crossCounts[crossCat] = (grouped[baseCat].crossCounts[crossCat] || 0) + count;
              grouped[baseCat].total += count;
              grandTotal += count;
          });

          const uniqueCrossCats = Object.keys(crossCategoryColors).sort();
          
          const rows = Object.values(grouped).map(row => {
              return {
                  ...row,
                  bars: uniqueCrossCats.map(cat => ({
                      sector: cat,
                      count: row.crossCounts[cat] || 0,
                      color: crossCategoryColors[cat]
                  }))
              };
          }).sort((a,b) => b.total - a.total);

          setPivotData({
              grandTotal,
              crossCategories: uniqueCrossCats.map(cat => ({ name: cat, color: crossCategoryColors[cat] })),
              rows,
              baseLabel: preguntas.find(p => p.id == pivotBaseQuestion)?.texto_pregunta || 'Variable Base',
              crossLabel: pivotCrossQuestion === 'sector' ? 'Sector' : (preguntas.find(p => p.id == pivotCrossQuestion)?.texto_pregunta || 'Variable de Cruce')
          });
      } catch (error) {
          console.error("Error loading pivot data", error);
          alert("Error al cargar datos cruzados.");
      } finally {
          setPivotLoading(false);
      }
  };

  const handleExport = () => {
    // ... CSV Export logic ...
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Pregunta,Opción,Total,Porcentaje\n"
      + Object.entries(stats).map(([id, s]) => {
          if (s.type === 'chart-sector') {
              return s.rows.map(r => `"${s.label}","${r.label}",${r.total},${r.percentage}%`).join("\n");
          }
          return `"${s.label}","Valor Promedio",${s.value || 0},100%`;
      }).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `estadisticas_encuesta_${selectedPeriodoId}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const saveChartAsImage = async (elementId, filename) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Temporarily remove 'hide-in-print' if present just to capture it
    const wasHidden = element.classList.contains('hide-in-print');
    if (wasHidden) element.classList.remove('hide-in-print');
    
    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error saving image:', err);
    } finally {
      if (wasHidden) element.classList.add('hide-in-print');
    }
  };

  const handlePrintPDF = () => {
    setShowPdfModal(true);
  };

  const executePrint = () => {
    setShowPdfModal(false);
    setTimeout(() => {
        window.print();
    }, 150);
  };

  return (
    <div className="dashboard-container animate-fade-in" style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto', background: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* Print Styles */}
      <style>{`
        @media screen {
          .print-only { display: none !important; }
        }
        @media print {
          @page { size: A4; margin: 0.6cm; }
          body { background: white !important; -webkit-print-color-adjust: exact !important; }
          .dashboard-container { padding: 0 !important; background: white !important; width: 100% !important; max-width: none !important; }
          .no-print { display: none !important; }
          .glass-card { 
            box-shadow: none !important; 
            border: 1px solid #ccc !important; 
            break-inside: avoid !important;
            margin-bottom: 0.6cm !important;
            padding: 0.5cm !important;
            page-break-after: auto;
          }
          h4 { font-size: 1.2rem !important; margin-bottom: 0.4rem !important; }
          .bar-container { transform: scale(0.95); transform-origin: left; }
          .chart-row { grid-template-columns: 160px 1fr !important; }
          .percentage-text { font-size: 1.6rem !important; }
          .dashboard-grid { 
            display: block !important; 
          }
          .print-header {
            display: block !important;
            margin-bottom: 1cm;
            text-align: center;
            border-bottom: 2px solid #1e293b;
            padding-bottom: 0.6cm;
          }
          .print-header img { height: 70px !important; }
          .print-header h1 { font-size: 1.6rem !important; }
          .force-print-block {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            height: auto !important;
            overflow: visible !important;
          }
          .no-print-logic {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            height: auto !important;
            overflow: visible !important;
          }
          table.force-print-block { border: 1px solid #000 !important; font-size: 0.8rem !important; }
          table.force-print-block th,
          table.force-print-block td { border: 1px solid #000 !important; padding: 0.4rem 0.6rem !important; }
          .section-group { page-break-before: always; }
          .section-group:first-child { page-break-before: auto; }
        }
        .print-header { display: none; }
      `}</style>


      <div className="print-header" style={{ marginBottom: '3rem', borderBottom: '4px solid #1e293b', paddingBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img src={logo} alt="CEM Logo" style={{ height: '90px' }} />
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ color: '#1e293b', fontSize: '2.2rem', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '-1px' }}>
              REPORTE DE RELEVAMIENTO ECONÓMICO
            </h1>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', marginTop: '0.5rem', fontSize: '1rem', fontWeight: '700', color: '#64748b' }}>
              <span>PERIODO: {periodos.find(p => p.id === selectedPeriodoId)?.mes}/{periodos.find(p => p.id === selectedPeriodoId)?.anio}</span>
              <span>FECHA: {new Date().toLocaleDateString('es-AR')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', background: 'white', padding: '1.2rem 2rem', borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '0.8rem', borderRadius: '1rem', color: 'white' }}>
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.5px' }}>Dashboard de Resultados</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Análisis estadístico y visualización de datos</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate('/admin')}>
            <Building2 size={18} /> Administración
          </button>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowSettingsModal(true)}>
            <Settings2 size={18} /> Administrar Gráficos
          </button>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handlePrintPDF}>
            <Download size={18} /> Descargar PDF
          </button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleExport}>
            <FileText size={18} /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
        
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '1.5rem', background: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Filter size={18} color="var(--primary)" /> Filtros de Análisis
            </h3>
            
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem', color: '#94a3b8' }}>Encuesta</label>
                <select value={selectedEncuestaId || ''} onChange={(e) => setSelectedEncuestaId(parseInt(e.target.value))} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.8rem', padding: '0.8rem' }}>
                  {encuestas.map(e => <option key={e.id} value={e.id}>{e.titulo}</option>)}
                </select>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem', color: '#94a3b8' }}>Período</label>
                <select value={selectedPeriodoId || ''} onChange={(e) => setSelectedPeriodoId(parseInt(e.target.value))} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.8rem', padding: '0.8rem' }}>
                  {periodos.map(p => <option key={p.id} value={p.id}>{p.mes}/{p.anio}</option>)}
                </select>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem', color: '#94a3b8' }}>Localidad</label>
                <select value={selectedLocalidadId} onChange={(e) => setSelectedLocalidadId(e.target.value)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.8rem', padding: '0.8rem' }}>
                  <option value="">Todas las localidades</option>
                  {localidades.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem', color: '#94a3b8' }}>Sección</label>
                <select value={selectedSeccionId} onChange={(e) => setSelectedSeccionId(e.target.value)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.8rem', padding: '0.8rem' }}>
                  <option value="">Todas las secciones</option>
                  {secciones.map(s => <option key={s.id} value={s.id}>{s.titulo}</option>)}
                </select>
              </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem', color: '#94a3b8' }}>Situación de IVA</label>
                  <select value={selectedIvaStatus} onChange={(e) => setSelectedIvaStatus(e.target.value)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.8rem', padding: '0.8rem' }}>
                    <option value="">Todas las situaciones</option>
                    <option value="Monotributista">Monotributista</option>
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                  </select>
                </div>

              <button className="btn btn-outline" style={{ width: '100%', marginTop: '0.5rem', borderColor: '#e2e8f0', color: '#64748b' }} onClick={() => { setSelectedLocalidadId(''); setSelectedSeccionId(''); setSelectedIvaStatus(''); if (periodos.length > 0) setSelectedPeriodoId(periodos[0].id); }}>
                <RefreshCcw size={16} /> Limpiar Filtros
              </button>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '1.5rem', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <Users size={20} color="var(--primary)" />
              <span style={{ fontWeight: '700', fontSize: '1rem' }}>Resumen General</span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.2rem', color: 'white' }}>{totalRespuestas}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: '500' }}>Respuestas Recibidas</div>
          </div>

          {ivaBarData && (
            <div id="chart-iva-total" className={`glass-card animate-slide-up ${pdfSelection['iva_total'] === false ? 'hide-in-print' : ''}`} style={{ padding: '1.8rem', borderRadius: '1.5rem', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <BarChart2 size={18} color="var(--primary)" /> Situación ante el IVA (Total)
                </h4>
                <button className="btn btn-outline btn-small no-print" onClick={() => saveChartAsImage('chart-iva-total', 'iva_total')} title="Guardar imagen">
                  <Camera size={16} />
                </button>
              </div>
              <div style={{ height: '200px', position: 'relative' }}>
                <Bar 
                  data={ivaBarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => ` Respuestas: ${context.raw}`
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { font: { weight: 'bold', size: 9 } }
                      },
                      y: {
                        grid: { color: '#f1f5f9' },
                        ticks: { font: { weight: 'bold' }, precision: 0 }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Constructor Dinámico de Gráficos Cruzados (Pivot Charts) - PRIMERO */}
          <div id="chart-pivot" className="glass-card animate-slide-up" style={{ padding: '2.5rem', borderRadius: '1.5rem', background: 'white', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.2rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '0.6rem', borderRadius: '0.8rem', color: 'white' }}>
                        <GitMerge size={24} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: '850', margin: 0, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Constructor de Gráficos Cruzados</h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Cruce dos variables para descubrir insights</p>
                    </div>
                </div>
                <button className="btn btn-outline btn-small no-print" onClick={() => saveChartAsImage('chart-pivot', 'grafico_cruzado')} title="Guardar imagen">
                  <Camera size={16} />
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1.5rem', alignItems: 'end', background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }} className="no-print">
                <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '0.6rem' }}>Variable 1 (Eje Y)</label>
                    <select value={pivotBaseQuestion} onChange={(e) => setPivotBaseQuestion(e.target.value)} style={{ width: '100%', background: 'white', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.8rem', fontSize: '0.85rem' }}>
                        <option value="">-- Seleccione una pregunta --</option>
                        {preguntas.filter(p => p.tipo !== 'texto' && p.tipo !== 'archivo' && p.tipo !== 'titulo').map(p => (
                            <option key={p.id} value={p.id}>{p.texto_pregunta.substring(0, 80)}{p.texto_pregunta.length > 80 ? '...' : ''}</option>
                        ))}
                    </select>
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '0.6rem' }}>Variable 2 (Agrupación / Leyenda)</label>
                    <select value={pivotCrossQuestion} onChange={(e) => setPivotCrossQuestion(e.target.value)} style={{ width: '100%', background: 'white', border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.8rem', fontSize: '0.85rem' }}>
                        <option value="">-- Seleccione una agrupación --</option>
                        <option value="sector" style={{ fontWeight: 'bold' }}>⭐ SECTOR INDUSTRIAL/COMERCIAL</option>
                        {preguntas.filter(p => p.tipo !== 'texto' && p.tipo !== 'archivo' && p.tipo !== 'titulo' && p.id != pivotBaseQuestion).map(p => (
                            <option key={p.id} value={p.id}>{p.texto_pregunta.substring(0, 80)}{p.texto_pregunta.length > 80 ? '...' : ''}</option>
                        ))}
                    </select>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={handleLoadPivot} 
                    disabled={pivotLoading || !pivotBaseQuestion || !pivotCrossQuestion}
                    style={{ padding: '0.8rem 1.5rem', height: '45px', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                >
                    {pivotLoading ? <RefreshCcw className="animate-spin" size={18} /> : <BarChart2 size={18} />}
                    Generar Gráfico
                </button>
            </div>

            {pivotData && (
                <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>{pivotData.baseLabel}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.5rem 0 0 0', fontWeight: '600' }}>Agrupado por: <span style={{ color: 'var(--primary)' }}>{pivotData.crossLabel}</span></p>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        {pivotData.crossCategories.map((cat, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase' }}>
                                <div style={{ width: '14px', height: '14px', background: cat.color, borderRadius: '2px' }} /> {cat.name}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gap: '0', border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
                        {pivotData.rows.map((row, rIdx) => {
                            const grandSelectedTotal = pivotData.grandTotal;
                            const displayPct = grandSelectedTotal > 0 ? ((row.total / grandSelectedTotal) * 100).toFixed(1) : 0;

                            return (
                                <div key={rIdx} className="chart-row" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', borderBottom: rIdx === pivotData.rows.length - 1 ? 'none' : '1px solid #e2e8f0', background: 'white' }}>
                                    <div style={{ padding: '0.8rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #e2e8f0', textAlign: 'center', background: '#f8fafc' }}>
                                        <div style={{ fontWeight: '700', fontSize: '0.75rem', lineHeight: '1.2', marginBottom: '0.5rem', color: '#1e293b' }}>{row.label}</div>
                                        <div className="percentage-text" style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary)' }}>{displayPct}%</div>
                                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '700' }}>Total: {row.total}</div>
                                    </div>
                                    <div className="bar-container" style={{ padding: '0.8rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'center' }}>
                                        {row.bars.map((bar, bIdx) => {
                                            if (bar.count === 0) return null;
                                            const barRelPct = grandSelectedTotal > 0 ? ((bar.count / grandSelectedTotal) * 100).toFixed(1) : 0;
                                            return (
                                                <div key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                    <div style={{ width: '60px', fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={bar.sector}>{bar.sector}</div>
                                                    <div style={{ height: '12px', width: `${Math.max(barRelPct * 2, 2)}%`, maxWidth: '85%', background: bar.color, borderRadius: '2px', transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                                                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b' }}>{barRelPct}% ({bar.count})</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                );
              })()}
            </div>
              </div>
            )}
          </div>

          {/* ===== DASHBOARD EJECUTIVO DE CÁMARAS Y ASOCIACIONES ===== */}
          {(() => {
            if (!camaraBarData || camaraWithPct.length === 0) return null;

            return (
              <div id="chart-camara" className="glass-card animate-slide-up" style={{ padding: '2rem', borderRadius: '1.5rem', background: 'white' }}>
                {/* Executive Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                  margin: '-2rem -2rem 2rem -2rem',
                  padding: '1.8rem 2rem',
                  borderRadius: '1.5rem 1.5rem 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.12)',
                      padding: '0.7rem',
                      borderRadius: '0.9rem',
                      backdropFilter: 'blur(8px)'
                    }}>
                      <Building2 size={26} color="#fff" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.45rem', color: '#fff', margin: 0, fontWeight: '900', letterSpacing: '-0.5px' }}>
                        Dashboard Ejecutivo
                      </h2>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#94a3b8', fontWeight: '500' }}>
                        Cámaras y Asociaciones · <strong style={{ color: '#fff' }}>{camaraGrandTotal}</strong> asociados registrados
                      </p>
                    </div>
                  </div>
                  <button className="btn btn-outline btn-small no-print" onClick={() => saveChartAsImage('chart-camara', 'camaras')} title="Guardar imagen" style={{ borderColor: '#475569', color: '#94a3b8' }}>
                    <Camera size={16} />
                  </button>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '1.2rem', borderRadius: '1rem', color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7, marginBottom: '0.3rem', fontWeight: '600' }}>Total Asociados</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900' }}>{camaraGrandTotal}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', padding: '1.2rem', borderRadius: '1rem', color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7, marginBottom: '0.3rem', fontWeight: '600' }}>Cámaras Activas</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900' }}>{camaraActiveCount}</div>
                  </div>

                </div>

                {/* Participación general */}
                <div style={{ padding: '1.2rem 1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>
                    FORMA PARTE DE UNA CÁMARA O ASOCIACIÓN
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                    <div style={{ flex: 1, height: '24px', background: '#e2e8f0', borderRadius: '12px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${camaraGrandTotal > 0 ? (camaraGrandTotal / Math.max(totalRespuestas, 1)) * 100 : 0}%`, background: '#22c55e', height: '100%', transition: 'width 1s ease' }} />
                      <div style={{ width: `${(totalRespuestas - camaraGrandTotal) > 0 ? ((totalRespuestas - camaraGrandTotal) / Math.max(totalRespuestas, 1)) * 100 : 0}%`, background: '#94a3b8', height: '100%', transition: 'width 1s ease' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: '800', color: '#16a34a' }}>{camaraGrandTotal} ({totalRespuestas > 0 ? ((camaraGrandTotal / totalRespuestas) * 100).toFixed(1) : '0'}%)</span>
                    <span style={{ fontWeight: '600', color: '#94a3b8' }}>Basado en {totalRespuestas} respuestas</span>
                    <span style={{ fontWeight: '700', color: '#64748b' }}>{(totalRespuestas - camaraGrandTotal)} ({totalRespuestas > 0 ? (((totalRespuestas - camaraGrandTotal) / totalRespuestas) * 100).toFixed(1) : '0'}%) no pertenece</span>
                  </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  {[
                    { key: 'top10', label: 'Top 10' },
                    { key: 'top15', label: 'Top 15' },
                    { key: 'top20', label: 'Top 20' },
                    { key: 'all', label: 'Todas' }
                  ].map(opt => (
                    <button key={opt.key}
                      onClick={() => setCamaraFilter(opt.key)}
                      className="btn btn-small"
                      style={{
                        padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: '700', borderRadius: '2rem',
                        background: camaraFilter === opt.key ? 'var(--primary)' : '#f1f5f9',
                        color: camaraFilter === opt.key ? 'white' : '#475569',
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >{opt.label}</button>
                  ))}
                </div>

                {/* Full-width Horizontal Bar Chart (sin torta) */}
                <div style={{ minHeight: `${Math.max(camaraFiltered.length * 42, 300)}px`, position: 'relative', width: '100%' }}>
                  {camaraBarData && (
                    <Bar data={{
                      labels: camaraFiltered.map(c => c.nombre),
                      datasets: [{
                        label: 'Asociados',
                        data: camaraFiltered.map(c => c.total),
                        backgroundColor: camaraFiltered.map(c => {
                          if (c.total > 10) return '#22c55e';
                          if (c.total >= 5) return '#eab308';
                          return '#ef4444';
                        }),
                        borderColor: camaraFiltered.map(c => {
                          if (c.total > 10) return '#16a34a';
                          if (c.total >= 5) return '#ca8a04';
                          return '#dc2626';
                        }),
                        borderWidth: 2,
                        borderRadius: 6,
                        barThickness: 28,
                        percentages: camaraFiltered.map(c => c.percentage)
                      }]
                    }} options={{
                      indexAxis: 'y',
                      responsive: true,
                      maintainAspectRatio: false,
                      onClick: handleCamaraBarClick,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => ` ${ctx.raw} asociados (${camaraFiltered[ctx.dataIndex]?.percentage || 0}%)`
                          }
                        }
                      },
                      scales: {
                        x: {
                          beginAtZero: true,
                          grid: { color: '#f1f5f9' },
                          ticks: { precision: 0, font: { weight: 'bold', size: 12 } }
                        },
                        y: {
                          grid: { display: false },
                          ticks: {
                            font: { weight: 'bold', size: 12 },
                            maxRotation: 0,
                            autoSkip: false
                          }
                        }
                      }
                    }} />
                  )}
                </div>

                {/* Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1.2rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0', marginTop: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Total de asociados</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e293b' }}>{camaraGrandTotal}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Cámaras activas</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e293b' }}>{camaraActiveCount}</div>
                  </div>
                </div>

                {/* Color legend */}
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: '700', color: '#22c55e' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#22c55e' }} /> &gt;10 asociados
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: '700', color: '#eab308' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#eab308' }} /> 5-10 asociados
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: '700', color: '#ef4444' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' }} /> &lt;5 asociados
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: '700', color: '#64748b' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#64748b' }} /> Click en barra para ver detalle
                  </div>
                </div>
              </div>
            );
          })()}

          <div id="chart-rubros" className={`glass-card animate-slide-up ${pdfSelection['rubros'] === false ? 'hide-in-print' : ''}`} style={{ padding: '2rem', borderRadius: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>Participación por rubro</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline btn-small no-print" onClick={() => saveChartAsImage('chart-rubros', 'rubros')} title="Guardar imagen">
                    <Camera size={16} />
                  </button>
                  <button 
                    className="btn btn-outline btn-small" 
                    onClick={() => setSelectedSectors(sectorDistribution.map(s => s.nombre))}
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                  >
                    Marcar Todos
                  </button>
                </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {sectorDistribution.map(s => {
                const isActive = selectedSectors.includes(s.nombre);
                const color = PDF_COLORS[s.nombre.toUpperCase()] || activeSectorColors[s.nombre] || DEFAULT_SECTOR_COLOR;
                return (
                  <div 
                    key={s.sector_id} 
                    onClick={() => toggleSector(s.nombre)}
                    className="no-print"
                    style={{ 
                      padding: '0.5rem 1rem', 
                      borderRadius: '2rem', 
                      background: isActive ? color : '#f1f5f9', 
                      border: 'none',
                      cursor: 'pointer',
                      opacity: isActive ? 1 : 0.5,
                      transition: 'all 0.2s ease',
                      color: isActive ? '#fff' : '#64748b',
                      fontWeight: '700',
                      fontSize: '0.85rem'
                    }}
                  >
                    {s.nombre}
                  </div>
                );
              })}
            </div>
          </div>

          {/* LOCALIDAD DISTRIBUTION CHART */}
          {(() => {
            const filteredLocalidad = [];
            if (localidadStats) {
              const aggregated = {};
              localidadStats.forEach(l => {
                if (selectedSectors.length > 0 && !selectedSectors.includes(l.sector_nombre)) return;
                if (!aggregated[l.localidad_nombre]) {
                  aggregated[l.localidad_nombre] = 0;
                }
                aggregated[l.localidad_nombre] += Number(l.count);
              });
              Object.entries(aggregated).forEach(([name, count]) => {
                filteredLocalidad.push({ localidad_nombre: name, count });
              });
              filteredLocalidad.sort((a, b) => b.count - a.count);
            }

            return (
              <div id="chart-localidades" className="glass-card animate-slide-up no-print" style={{ padding: '2rem', borderRadius: '1.5rem', background: 'white', marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '800' }}>
                    <MapPin size={20} color="var(--primary)" /> Distribución por Localidad
                  </h3>
                  <button className="btn btn-outline btn-small no-print" onClick={() => saveChartAsImage('chart-localidades', 'localidades')} title="Guardar imagen">
                    <Camera size={16} />
                  </button>
                </div>
                <div style={{ height: '300px', position: 'relative' }}>
                  {filteredLocalidad.length > 0 ? (
                    <Bar data={{
                      labels: filteredLocalidad.map(l => l.localidad_nombre),
                      datasets: [{
                        label: 'Respuestas',
                        data: filteredLocalidad.map(l => l.count),
                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                        borderRadius: 6
                      }]
                    }} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
                        x: { grid: { display: false } }
                      }
                    }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      No hay datos de Localidad
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* CAMARA EXECUTIVE DASHBOARD */}
          {(() => {
            if (true) return null; // Movido al inicio del dashboard

            return (
              <div className="glass-card animate-slide-up" style={{ padding: '2rem', borderRadius: '1.5rem', background: 'white', marginTop: '2rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '800' }}>
                    <Building2 size={22} color="var(--primary)" /> Dashboard Ejecutivo de Cámaras y Asociaciones
                  </h3>
                  <button className="btn btn-outline btn-small no-print" onClick={() => saveChartAsImage('chart-camara', 'camaras')} title="Guardar imagen">
                    <Camera size={16} />
                  </button>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '1.2rem', borderRadius: '1rem', color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7, marginBottom: '0.5rem', fontWeight: '600' }}>Total Asociados</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900' }}>{camaraGrandTotal}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', padding: '1.2rem', borderRadius: '1rem', color: 'white', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7, marginBottom: '0.5rem', fontWeight: '600' }}>Cámaras Activas</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900' }}>{camaraActiveCount}</div>
                  </div>

                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  {[
                    { key: 'top10', label: 'Top 10' },
                    { key: 'top15', label: 'Top 15' },
                    { key: 'top20', label: 'Top 20' },
                    { key: 'all', label: 'Todas' }
                  ].map(opt => (
                    <button key={opt.key}
                      onClick={() => setCamaraFilter(opt.key)}
                      className="btn btn-small"
                      style={{
                        padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: '700', borderRadius: '2rem',
                        background: camaraFilter === opt.key ? 'var(--primary)' : '#f1f5f9',
                        color: camaraFilter === opt.key ? 'white' : '#475569',
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >{opt.label}</button>
                  ))}
                </div>

                {/* Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  {/* Horizontal Bar Chart */}
                  <div style={{ minHeight: `${Math.max(camaraFiltered.length * 32, 200)}px`, position: 'relative' }}>
                    {camaraBarData && (
                      <Bar data={camaraBarData} options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        onClick: handleCamaraBarClick,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (ctx) => ` ${ctx.raw} asociados (${camaraFiltered[ctx.dataIndex]?.percentage || 0}%)`
                            }
                          },
                          barLabel: { enabled: true }
                        },
                        scales: {
                          x: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0, font: { weight: 'bold' } } },
                          y: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 11 } } }
                        }
                      }} />
                    )}
                  </div>

                  {/* Pie Chart */}
                  <div style={{ height: '300px', position: 'relative' }}>
                    {camaraPieData && (
                      <Pie data={camaraPieData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: { boxWidth: 10, padding: 8, font: { size: 10, weight: 'bold' } }
                          },
                          tooltip: {
                            callbacks: {
                              label: (ctx) => ` ${ctx.label}: ${ctx.raw} asociados (${((ctx.raw / camaraGrandTotal) * 100).toFixed(1)}%)`
                            }
                          }
                        }
                      }} />
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Total de asociados</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e293b' }}>{camaraGrandTotal}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Cámaras activas</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e293b' }}>{camaraActiveCount}</div>
                  </div>
                </div>

                {/* Color legend */}
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: '700', color: '#22c55e' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#22c55e' }} /> &gt;10 asociados
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: '700', color: '#eab308' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#eab308' }} /> 5-10 asociados
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: '700', color: '#ef4444' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' }} /> &lt;5 asociados
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: '700', color: '#64748b' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#64748b' }} /> Click en barra para ver detalle
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Camara Detail Modal */}
          {selectedCamara && (
            <>
              <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.35)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'fixed',
                top: (popupPos?.top ?? 0) + 'px',
                left: (popupPos?.left ?? 0) + 'px',
                transform: 'none',
                zIndex: 10000,
                background: 'white', borderRadius: '1.2rem', padding: '2rem',
                maxWidth: '500px', width: 'calc(100% - 2rem)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}>
                <button onClick={() => setSelectedCamara(null)} style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: '#f1f5f9', border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', color: '#64748b', fontWeight: '700', zIndex: 1,
                }}>×</button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #e2e8f0' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: getCamaraColor(selectedCamara.total) + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: getCamaraColor(selectedCamara.total), fontWeight: '900', fontSize: '1.2rem'
                  }}>
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#1e293b' }}>{selectedCamara.nombre}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Cámara / Asociación</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.8rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Asociados</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: '#1e293b' }}>{selectedCamara.total}</div>
                  </div>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.8rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Participación</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: '#1e293b' }}>{selectedCamara.percentage}%</div>
                  </div>
                </div>

                {selectedCamara.sectors && Object.keys(selectedCamara.sectors).length > 0 && (
                  <>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.8rem 0' }}>Distribución por Sector</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Object.entries(selectedCamara.sectors)
                        .filter(([_, count]) => count > 0)
                        .sort(([,a], [,b]) => b - a)
                        .map(([sector, count]) => {
                          const sectorPct = selectedCamara.total > 0 ? ((count / selectedCamara.total) * 100).toFixed(1) : 0;
                          const color = activeSectorColors[sector] || PDF_COLORS[sector.toUpperCase()] || DEFAULT_SECTOR_COLOR;
                          return (
                            <div key={sector} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                              <div style={{ flex: 1, height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${sectorPct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s' }} />
                              </div>
                              <span style={{ minWidth: '60px', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>{sector}</span>
                              <span style={{ minWidth: '30px', fontSize: '0.75rem', fontWeight: '800', color: '#1e293b', textAlign: 'right' }}>{sectorPct}%</span>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <button className="btn btn-outline" onClick={() => setSelectedCamara(null)} style={{ padding: '0.5rem 2rem', borderRadius: '2rem' }}>Cerrar</button>
                </div>
              </div>
            </>
          )}

          {selectedPeriodoId && (
            <div id="chart-iva-sectores" className={`glass-card animate-slide-up ${pdfSelection['iva'] === false ? 'hide-in-print' : ''}`} style={{ padding: '2.5rem', borderRadius: '1.5rem', background: 'white', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.2rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '0.6rem', borderRadius: '0.8rem', color: 'var(--primary)' }}>
                          <Building2 size={24} />
                      </div>
                      <div>
                          <h3 style={{ fontSize: '1.35rem', fontWeight: '850', margin: 0, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Situación ante el IVA</h3>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Distribución porcentual por sector comercial e industrial</p>
                      </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button className="btn btn-outline btn-small no-print" onClick={() => saveChartAsImage('chart-iva-sectores', 'iva_sectores')} title="Guardar imagen">
                        <Camera size={16} />
                      </button>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem' }}>
                          {sectorDistribution.map(s => (
                              <div key={s.sector_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                                  <span style={{ height: '10px', width: '10px', borderRadius: '3px', background: s.color || activeSectorColors[s.nombre] }} />
                                  {s.nombre}
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Gráfico estilo imagen: grupos con porcentaje + barras horizontales por sector */}
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #d1d5db', borderRadius: '1rem', overflow: 'hidden' }}>
                  {/* Leyenda de sectores */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', padding: '0.8rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                      {sectorDistribution.map(s => (
                          <div key={s.sector_id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>
                              <span style={{ height: '12px', width: '12px', borderRadius: '2px', background: s.color || activeSectorColors[s.nombre] || DEFAULT_SECTOR_COLOR, flexShrink: 0 }} />
                              {s.nombre}
                          </div>
                      ))}
                  </div>

                  {processedIvaData && processedIvaData.length > 0 ? null : (
                      <div style={{ padding: '1.5rem', background: '#fff8e1', border: '1px solid #f59e0b', borderRadius: '0.8rem', margin: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          <span style={{ fontWeight: '800', color: '#92400e', fontSize: '0.95rem' }}>⚠️ Sin datos de "Situación ante el IVA"</span>
                          {debugIva ? (
                              <table style={{ fontSize: '0.78rem', borderCollapse: 'collapse', width: '100%' }}>
                                  <tbody>
                                      <tr><td style={{ padding: '0.25rem 0.5rem', fontWeight: '700', color: '#92400e', width: '200px' }}>ID pregunta IVA detectada:</td><td style={{ padding: '0.25rem 0.5rem', color: '#78350f' }}>{debugIva.iva_pregunta_id ?? '❌ NO ENCONTRADA'}</td></tr>
                                      <tr><td style={{ padding: '0.25rem 0.5rem', fontWeight: '700', color: '#92400e' }}>Respuestas totales para esa pregunta:</td><td style={{ padding: '0.25rem 0.5rem', color: '#78350f' }}>{debugIva.respuestas_iva_total ?? '-'}</td></tr>
                                      <tr><td style={{ padding: '0.25rem 0.5rem', fontWeight: '700', color: '#92400e' }}>Con sector_id asignado:</td><td style={{ padding: '0.25rem 0.5rem', color: debugIva.respuestas_iva_con_sector > 0 ? '#166534' : '#dc2626', fontWeight: '800' }}>{debugIva.respuestas_iva_con_sector ?? '-'}</td></tr>
                                      <tr><td style={{ padding: '0.25rem 0.5rem', fontWeight: '700', color: '#92400e' }}>Sin sector_id:</td><td style={{ padding: '0.25rem 0.5rem', color: debugIva.respuestas_sin_sector > 0 ? '#dc2626' : '#166534', fontWeight: '800' }}>{debugIva.respuestas_sin_sector ?? '-'}</td></tr>
                                      {debugIva.muestra_sin_sector && debugIva.muestra_sin_sector.length > 0 && (
                                          <tr><td style={{ padding: '0.25rem 0.5rem', fontWeight: '700', color: '#92400e', verticalAlign: 'top' }}>Muestra (IDs):</td><td style={{ padding: '0.25rem 0.5rem', color: '#78350f', fontSize: '0.72rem' }}>{debugIva.muestra_sin_sector.map(r => `#${r.id} fecha=${r.fecha_respuesta} localidad=${r.localidad_id} empresa=${r.empresa_id ?? '-'} sector_id=${r.sector_id ?? 'NULL'} iva="${r.iva_respuesta ?? '-'}"`).join(' | ')}</td></tr>
                                      )}
                                      {debugIva.todas_las_preguntas && debugIva.todas_las_preguntas.length > 0 && (
                                          <tr><td colSpan="2" style={{ padding: '0.25rem 0.5rem', color: '#92400e', fontSize: '0.72rem', maxWidth: '800px', overflowX: 'auto' }}><b>Preguntas en DB (para diagnóstico):</b><br/>{debugIva.todas_las_preguntas.map(p => `[ID ${p.id}] ${p.texto_pregunta}`).join(', ')}</td></tr>
                                      )}
                                  </tbody>
                              </table>
                          ) : (
                              <span style={{ fontSize: '0.82rem', color: '#78350f' }}>
                                  Subí el nuevo api.php al servidor y recargá. El backend no devuelve info de diagnóstico aún.
                              </span>
                          )}
                      </div>
                  )}

                  {processedIvaData && processedIvaData.map((group, idx) => {
                      const grandTotal = processedIvaData.reduce((acc, g) => acc + g.total, 0);
                      // Calcular el máximo de barras para escalar el ancho (máximo barRelPct entre todos los grupos y sectores)
                      let maxPct = 0;
                      processedIvaData.forEach(g => {
                          sectorDistribution.forEach(s => {
                              const c = g.sectors[s.nombre] ? g.sectors[s.nombre].count : 0;
                              const p = grandTotal > 0 ? (c / grandTotal) * 100 : 0;
                              if (p > maxPct) maxPct = p;
                          });
                      });

                      return (
                          <div key={idx} style={{
                              display: 'grid',
                              gridTemplateColumns: '160px 1fr',
                              borderBottom: idx < processedIvaData.length - 1 ? '1px solid #e2e8f0' : 'none',
                              background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                          }}>
                              {/* Columna izquierda: nombre del grupo + porcentaje grande */}
                              <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  padding: '1.5rem 1rem',
                                  borderRight: '1px solid #e2e8f0',
                                  textAlign: 'center',
                                  gap: '0.3rem',
                                  background: '#fff'
                              }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.2 }}>
                                      {group.status}
                                  </span>
                                  <span style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1e3a5f', lineHeight: 1 }}>
                                      {group.percentage}%
                                  </span>
                                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>
                                      ({group.total} resp.)
                                  </span>
                              </div>

                              {/* Columna derecha: barras por sector */}
                              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.6rem', padding: '1.2rem 1.5rem' }}>
                                  {sectorDistribution.map(sector => {
                                      const sectorData = group.sectors[sector.nombre];
                                      const count = sectorData ? sectorData.count : 0;
                                      const barRelPct = grandTotal > 0 ? ((count / grandTotal) * 100) : 0;
                                      // Escalar barra respecto al máximo para que se vea bien
                                      const widthPct = maxPct > 0 ? (barRelPct / maxPct) * 100 : 0;
                                      const sectorColor = sector.color || activeSectorColors[sector.nombre] || DEFAULT_SECTOR_COLOR;

                                      return (
                                          <div key={sector.nombre} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                                              {/* Barra */}
                                              <div style={{ flex: 1, background: '#e5e7eb', height: '18px', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                                                  <div style={{
                                                      position: 'absolute', left: 0, top: 0, bottom: 0,
                                                      width: `${widthPct}%`,
                                                      background: sectorColor,
                                                      borderRadius: '3px',
                                                      transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                                  }} />
                                              </div>
                                              {/* Porcentaje */}
                                              <span style={{ minWidth: '48px', fontSize: '0.78rem', fontWeight: '800', color: '#1e293b', textAlign: 'left' }}>
                                                  {barRelPct.toFixed(1)}%
                                              </span>
                                          </div>
                                      );
                                  })}
                                  {/* Eje X simplificado */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem', paddingRight: '54px' }}>
                                      {[0, 10, 20, 30, 40].map(v => (
                                          <span key={v} style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: '600' }}>{v}%</span>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem', background: 'white', borderRadius: '1.5rem' }}>
                <RefreshCcw className="animate-spin" size={40} color="var(--primary)" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                    {(() => {
                        const allStats = Object.entries(stats).filter(([id, s]) => !hiddenCharts.includes(id) && !(s.label || '').toLowerCase().includes('seleccione su actividad económica'));
                        const sortedStats = [...allStats].sort((a, b) => {
                            const indexA = chartOrder.indexOf(a[0]);
                            const indexB = chartOrder.indexOf(b[0]);
                            if (indexA === -1 && indexB === -1) return 0;
                            if (indexA === -1) return 1;
                            if (indexB === -1) return -1;
                            return indexA - indexB;
                        });

                        return sortedStats.map(([id, s], idx) => (
                            <div id={`chart-q-${id}`} key={id} className={`glass-card animate-slide-up ${pdfSelection[`q_${id}`] === false ? 'hide-in-print' : ''}`} style={{ padding: '1.5rem 2rem', borderRadius: '1.5rem', background: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{ maxWidth: '70%' }}>
                                        <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.3rem' }}>{(s.label || '').toLowerCase().includes('nivel de actividad') ? 'Resultado general por actividad' : s.label}</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <BarChart3 size={14} /> Basado en {s.grandTotal || totalRespuestas} respuestas
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                        <div className="no-print" style={{ display: 'flex', gap: '0.4rem', borderRight: '1px solid #e2e8f0', paddingRight: '0.8rem' }}>
                                            <button 
                                                className="btn btn-outline" 
                                                style={{ padding: '0.4rem', borderRadius: '0.4rem' }} 
                                                onClick={() => saveChartAsImage(`chart-q-${id}`, `grafico_${id}`)}
                                                title="Guardar gráfico como imagen"
                                            >
                                                <Camera size={16} />
                                            </button>
                                            <button 
                                                className="btn btn-outline" 
                                                style={{ padding: '0.4rem', borderRadius: '0.4rem', opacity: idx === 0 ? 0.3 : 1, cursor: idx === 0 ? 'default' : 'pointer' }} 
                                                onClick={() => idx > 0 && moveChart(id, -1)}
                                                title="Subir gráfico"
                                            >
                                                <ChevronUp size={16} />
                                            </button>
                                            <button 
                                                className="btn btn-outline" 
                                                style={{ padding: '0.4rem', borderRadius: '0.4rem', opacity: idx === sortedStats.length - 1 ? 0.3 : 1, cursor: idx === sortedStats.length - 1 ? 'default' : 'pointer' }} 
                                                onClick={() => idx < sortedStats.length - 1 && moveChart(id, 1)}
                                                title="Bajar gráfico"
                                            >
                                                <ChevronDown size={16} />
                                            </button>
                                            <button 
                                                className="btn btn-outline" 
                                                style={{ padding: '0.4rem', borderRadius: '0.4rem', color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }} 
                                                onClick={() => toggleHideChart(id)}
                                                title="Ocultar gráfico"
                                            >
                                                <EyeOff size={16} />
                                            </button>
                                        </div>
                                        {s.type === 'chart-sector' && (
                                            <button 
                                                className={`btn btn-outline btn-small ${showSummary[id] ? 'active' : ''}`} 
                                                style={{ 
                                                    padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '0.8rem',
                                                    background: showSummary[id] ? 'var(--primary)' : 'white',
                                                    color: showSummary[id] ? 'white' : 'var(--primary)',
                                                    border: '1px solid var(--primary)', fontWeight: '800'
                                                }} 
                                                onClick={() => setShowSummary({...showSummary, [id]: !showSummary[id]})}
                                            >
                                                {showSummary[id] ? 'Ocultar Resumen' : 'Ver Resumen'}
                                            </button>
                                        )}
                                        <button 
                                            className={`btn btn-outline btn-small ${showTrend[id] ? 'active' : ''}`} 
                                            style={{ 
                                                padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '0.8rem',
                                                background: showTrend[id] ? '#1e293b' : 'white',
                                                color: showTrend[id] ? 'white' : '#1e293b',
                                                border: '1px solid #1e293b', fontWeight: '800'
                                            }} 
                                            onClick={() => handleShowTrend(id)}
                                        >
                                            {showTrend[id] ? 'Ocultar Tendencia' : 'Ver Tendencia'}
                                        </button>
                                    </div>
                                </div>

                                {/* Price change summary boxes */}
                                {s.type === 'chart-sector' && s.rows.some(r => /[↑↓]\s*-?\d+(\.\d+)?%/.test(r.label) || r.label === '0%') && (() => {
                                    const incLabels = ['↑ 0.5%','↑ 1%','↑ 1.5%','↑ 2%','↑ 2.5%','↑ 3%','↑ 3.5%','↑ 4%','↑ 4.5%','↑ 5%'];
                                    const noLabel = '0%';
                                    const decLabels = ['↓ -0.5%','↓ Más de -2%'];
                                    const inc = s.rows.filter(r => incLabels.includes(r.label)).reduce((a, r) => a + r.total, 0);
                                    const noc = s.rows.filter(r => r.label === noLabel).reduce((a, r) => a + r.total, 0);
                                    const dec = s.rows.filter(r => decLabels.includes(r.label)).reduce((a, r) => a + r.total, 0);
                                    const gTotal = Math.max(inc + noc + dec, 1);
                                    const cards = [
                                        { label: 'Percibe Aumentos', value: inc, color: '#ef4444', bg: '#fef2f2', prefix: '↑ ', big: true },
                                        { label: 'No Percibe Aumentos', value: noc, color: '#166534', bg: '#f0fdf4', prefix: '= ', big: false },
                                        { label: 'Percibe Disminución', value: dec, color: '#3b82f6', bg: '#eff6ff', prefix: '↓ ', big: false }
                                    ];
                                    return (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', padding: '0 0 1.2rem 0' }}>
                                            {cards.map(c => (
                                                <div key={c.label} style={{ background: c.bg, borderRadius: '0.8rem', padding: '0.8rem 1rem', textAlign: 'center' }}>
                                                    <div style={{ fontSize: c.big ? '2.4rem' : '1.4rem', fontWeight: '900', color: c.color }}>
                                                        {c.prefix}{((c.value / gTotal) * 100).toFixed(1)}%
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: '0.2rem' }}>{c.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {showTrend[id] && historicalData[id] && (
                                    <div className="animate-fade-in" style={{ marginBottom: '3rem', padding: '2rem', background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                            <h5 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                Tendencia Histórica: {s.label}
                                            </h5>
                                        </div>
                                        <div style={{ height: '400px' }}>
                                            <Line 
                                                data={historicalData[id]} 
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: { 
                                                            position: 'bottom',
                                                            labels: { font: { weight: 'bold', size: 11 }, usePointStyle: true }
                                                        },
                                                        tooltip: {
                                                            callbacks: {
                                                                label: (context) => `${context.dataset.label}: ${context.raw}%`
                                                            }
                                                        }
                                                    },
                                                    scales: {
                                                        y: { 
                                                            beginAtZero: true, 
                                                            max: 100,
                                                            ticks: { callback: (value) => value + '%' }
                                                        }
                                                    }
                                                }} 
                                            />
                                        </div>
                                    </div>
                                )}

                                {s.type === 'chart-sector' && (
                                    <div className={showSummary[id] ? "animate-fade-in" : "no-print-logic"} style={{ marginBottom: '2.5rem', overflowX: 'auto', borderRadius: '0.8rem', border: '1px solid #000', display: showSummary[id] ? 'block' : 'none' }}>
                                    <table className="force-print-block" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', background: 'white' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc' }}>
                                                <th colSpan={s.questionType === 'cuadricula' ? s.matrixCols.length + 1 : selectedSectors.length + 2} style={{ padding: '1rem', textAlign: 'center', fontWeight: '900', textTransform: 'uppercase', color: '#1e293b', borderBottom: '2px solid #000' }}>
                                                    {s.label}
                                                </th>
                                            </tr>
                                            <tr style={{ background: '#eef2ff' }}>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '800', borderRight: '1px solid #000' }}>Etiquetas de fila</th>
                                                {s.questionType === 'cuadricula' ? (
                                                    s.matrixCols.map(col => <th key={col} style={{ padding: '1rem', textAlign: 'center', fontWeight: '800', textTransform: 'uppercase', borderRight: '1px solid #000' }}>{col}</th>)
                                                ) : (
                                                    selectedSectors.sort().map(sector => <th key={sector} style={{ padding: '1rem', textAlign: 'center', fontWeight: '800', textTransform: 'uppercase', borderRight: '1px solid #000' }}>{sector}</th>)
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {s.rows.map((row, rIdx) => {
                                                const activeBars = row.bars.filter(b => selectedSectors.includes(b.sector));
                                                const rowSelectedTotal = activeBars.reduce((acc, b) => acc + b.count, 0);
                                                const grandSelectedTotal = s.rows.reduce((acc, r) => {
                                                    return acc + r.bars.filter(b => selectedSectors.includes(b.sector)).reduce((sub, b) => sub + b.count, 0);
                                                }, 0);

                                                if (rowSelectedTotal === 0 && selectedSectors.length > 0 && s.questionType !== 'cuadricula') return null;

                                                return (
                                                    <tr key={rIdx} style={{ borderBottom: '1px solid #000' }}>
                                                        <td style={{ padding: '0.8rem 1rem', fontWeight: '700', borderRight: '1px solid #000', color: '#1e293b' }}>{row.label}</td>
                                                        {s.questionType === 'cuadricula' ? (
                                                            s.matrixCols.map(col => {
                                                                const count = row.matrixCounts[col] || 0;
                                                                const rowTotal = s.matrixCols.reduce((acc, c) => acc + (row.matrixCounts[c] || 0), 0);
                                                                const pct = rowTotal > 0 ? ((count / rowTotal) * 100).toFixed(1) : '0.0';
                                                                return <td key={col} style={{ padding: '0.8rem', textAlign: 'center', borderRight: '1px solid #000' }}>{pct}% ({count})</td>;
                                                            })
                                                        ) : (
                                                            selectedSectors.sort().map(sector => {
                                                                const bar = row.bars.find(b => b.sector === sector);
                                                                const pct = grandSelectedTotal > 0 ? (((bar?.count || 0) / grandSelectedTotal) * 100).toFixed(2) : '0,00';
                                                                return <td key={sector} style={{ padding: '0.8rem', textAlign: 'center', borderRight: '1px solid #000' }}>{pct}%</td>;
                                                            })
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                            <tr style={{ background: '#f8fafc', fontWeight: '900', borderTop: '2px solid #000' }}>
                                                <td style={{ padding: '1rem', borderRight: '1px solid #000' }}>Total general</td>
                                                {s.questionType === 'cuadricula' ? (
                                                    s.matrixCols.map(col => {
                                                        const totalCol = s.rows.reduce((acc, row) => acc + (row.matrixCounts[col] || 0), 0);
                                                        return <td key={col} style={{ padding: '1rem', textAlign: 'center', borderRight: '1px solid #000' }}>{s.grandTotal > 0 ? ((totalCol / s.grandTotal) * 100).toFixed(2) : '0,00'}%</td>;
                                                    })
                                                ) : (
                                                    selectedSectors.sort().map(sector => {
                                                        const grandSelectedTotal = s.rows.reduce((acc, r) => {
                                                            return acc + r.bars.filter(b => selectedSectors.includes(b.sector)).reduce((sub, b) => sub + b.count, 0);
                                                        }, 0);
                                                        const totalCol = s.rows.reduce((acc, row) => {
                                                            const bar = row.bars.find(b => b.sector === sector);
                                                            return acc + (bar ? bar.count : 0);
                                                        }, 0);
                                                        return <td key={sector} style={{ padding: '1rem', textAlign: 'center', borderRight: '1px solid #000' }}>{grandSelectedTotal > 0 ? ((totalCol / grandSelectedTotal) * 100).toFixed(2) : '0,00'}%</td>;
                                                    })
                                                )}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                )}

                                {s.type === 'chart-sector' ? (
                                    <>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', justifyContent: 'center' }}>
                                            {Object.entries(activeSectorColors).filter(([name]) => selectedSectors.includes(name)).map(([name, color]) => {
                                                const isActive = activeRubroDetail?.qId === id && activeRubroDetail?.rubro === name;
                                                return (
                                                    <div key={name} onClick={() => setActiveRubroDetail(isActive ? null : { qId: id, rubro: name })}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.8rem', borderRadius: '2rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '800', color: isActive ? '#fff' : '#1e293b', background: isActive ? color : '#f1f5f9', textTransform: 'uppercase', transition: 'all 0.2s ease' }}>
                                                        <div style={{ width: '10px', height: '10px', background: isActive ? '#fff' : color, borderRadius: '2px' }} /> {name}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gap: '0', border: '1px solid #e2e8f0' }}>
                                        {[...s.rows]
                                            .sort((a, b) => {
                                                const totalA = a.bars.filter(ba => selectedSectors.includes(ba.sector)).reduce((acc, ba) => acc + ba.count, 0);
                                                const totalB = b.bars.filter(bb => selectedSectors.includes(bb.sector)).reduce((acc, bb) => acc + bb.count, 0);
                                                return totalB - totalA;
                                            })
                                            .map((row, rIdx) => {
                                            const activeBars = row.bars.filter(b => selectedSectors.includes(b.sector));
                                            const rowSelectedTotal = activeBars.reduce((acc, b) => acc + b.count, 0);
                                            
                                            const grandSelectedTotal = s.rows.reduce((acc, r) => {
                                                return acc + r.bars.filter(b => selectedSectors.includes(b.sector)).reduce((sub, b) => sub + b.count, 0);
                                            }, 0);

                                            const displayPct = grandSelectedTotal > 0 ? ((rowSelectedTotal / grandSelectedTotal) * 100).toFixed(1) : 0;

                                            if (rowSelectedTotal === 0 && selectedSectors.length > 0) return null;

                                            return (
                                                <div key={rIdx} className="chart-row" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                                                    <div style={{ padding: '0.8rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #e2e8f0', textAlign: 'center', background: '#f8fafc' }}>
                                                        <div style={{ fontWeight: '700', fontSize: '0.75rem', lineHeight: '1.2', marginBottom: '0.5rem', color: '#1e293b' }}>{row.label}</div>
                                                        <div className="percentage-text" style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary)' }}>{displayPct}%</div>
                                                    </div>
                                                    <div className="bar-container" style={{ padding: '0.8rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'center' }}>
                                                        {s.questionType === 'cuadricula' ? (
                                                            s.matrixCols.map((col, idx) => {
                                                                const count = row.matrixCounts[col] || 0;
                                                                const rowTotal = s.matrixCols.reduce((acc, c) => acc + (row.matrixCounts[c] || 0), 0);
                                                                if (count === 0) return null;
                                                                const barRelPct = rowTotal > 0 ? ((count / rowTotal) * 100).toFixed(1) : 0;
                                                                const colColors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899'];
                                                                const color = colColors[idx % colColors.length];
                                                                return (
                                                                    <div key={col} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                                        <div style={{ width: '80px', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={col}>{col}</div>
                                                                        <div style={{ height: '12px', width: `${Math.max(barRelPct * 2, 2)}%`, maxWidth: '85%', background: color, borderRadius: '2px', transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                                                                        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b' }}>{barRelPct}% ({count})</span>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            activeBars.map((bar) => {
                                                                const barRelPct = grandSelectedTotal > 0 ? ((bar.count / grandSelectedTotal) * 100).toFixed(1) : 0;
                                                                return (
                                                                    <div key={bar.sector} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                                        <div style={{ height: '12px', width: `${Math.max(barRelPct * 2, 2)}%`, maxWidth: '85%', background: bar.color, borderRadius: '2px', transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                                                                        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b' }}>{barRelPct}%</span>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', marginTop: '0.5rem' }}>
                                        <div />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2rem 0 2rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>
                                            <span>0,0%</span><span>10,0%</span><span>20,0%</span><span>30,0%</span><span>40,0%</span>
                                        </div>
                                    </div>

                                    {/* Detail table for selected rubro — solo en preguntas de actividad */}
                                    {activeRubroDetail?.qId === id && s.type === 'chart-sector' && ((s.label || '').toLowerCase().includes('nivel de actividad') || (s.label || '').toLowerCase().includes('movimiento')) && (
                                    (() => {
                                        const rubroName = activeRubroDetail.rubro;
                                        // Cross-tab: Actividad × Rating (like old system)
                                        if (rubroCrossTab && rubroCrossTab.rows.length > 0) {
                                            const { rows, crossCats, grandTotal, crossTotals } = rubroCrossTab;
                                            return (
                                                <div style={{ marginTop: '1rem', borderTop: '2px solid #e2e8f0', padding: '1rem 0 0' }}>
                                                    <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1e293b', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                        {rubroName}
                                                    </div>
                                                    <div style={{ overflowX: 'auto' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                            <thead>
                                                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                                                    <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontWeight: '800', color: '#475569', whiteSpace: 'nowrap' }}>Actividad</th>
                                                                    {crossCats.map(cc => (
                                                                        <th key={cc} style={{ padding: '0.4rem 0.4rem', textAlign: 'center', fontWeight: '800', color: '#475569', fontSize: '0.85rem' }}>{cc}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {rows.map(r => (
                                                                    <tr key={r.label} style={{ borderBottom: '2px solid #94a3b8' }}>
                                                                        <td style={{ padding: '0.35rem 0.6rem', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{r.label}</td>
                                                                        {r.values.map((v, vi) => {
                                                                            const pct = grandTotal > 0 ? ((v / grandTotal) * 100).toFixed(1) : '0.0';
                                                                            return (
                                                                                <td key={vi} style={{ padding: '0.35rem 0.4rem', textAlign: 'center', fontWeight: '700', color: v > 0 ? '#1e293b' : '#cbd5e1', fontSize: '0.85rem' }}>
                                                                                    {pct.replace('.', ',')}%
                                                                                </td>
                                                                            );
                                                                        })}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot>
                                                                <tr style={{ background: '#f8fafc', fontWeight: '900', borderTop: '2px solid #e2e8f0' }}>
                                                                    <td style={{ padding: '0.4rem 0.6rem', color: '#1e293b', fontSize: '0.85rem' }}>TOTAL GENERAL</td>
                                                                    {crossTotals.map((ct, ci) => {
                                                                        const pct = grandTotal > 0 ? ((ct / grandTotal) * 100).toFixed(2) : '0.00';
                                                                        return <td key={ci} style={{ padding: '0.4rem 0.4rem', textAlign: 'center', color: '#1e293b', fontSize: '0.85rem' }}>{pct.replace('.', ',')}%</td>;
                                                                    })}
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (rubroCrossTabLoading) {
                                            return (
                                                <div style={{ marginTop: '1rem', borderTop: '2px solid #e2e8f0', padding: '1rem 0 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                                                    Cargando datos...
                                                </div>
                                            );
                                        }
                                        // Build pivot table from subrubroPivot data for ALL rubros
                                        const RATING_LABELS = ['MUY MALO', 'MALO', 'REGULAR', 'BUENO', 'MUY BUENO'];
                                        const pivotData = s.subrubroPivot || {};
                                        const pivotSubrubros = Object.keys(pivotData)
                                            .filter(sr => pivotData[sr][rubroName])
                                            .sort();
                                        if (pivotSubrubros.length === 0) return null;
                                        const pivotRows = pivotSubrubros.map(sr => ({
                                            label: sr,
                                            values: RATING_LABELS.map(rating => pivotData[sr][rubroName][rating] || 0)
                                        }));
                                        const pivotGrandTotal = pivotRows.reduce((a, row) => a + row.values.reduce((b, v) => b + v, 0), 0);
                                        const pivotCrossTotals = RATING_LABELS.map((_, ci) =>
                                            pivotRows.reduce((a, row) => a + row.values[ci], 0)
                                        );
                                        return (
                                            <div style={{ marginTop: '1rem', borderTop: '2px solid #e2e8f0', padding: '1rem 0 0' }}>
                                                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1e293b', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                    {rubroName}
                                                </div>
                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                        <thead>
                                                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                                                <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', fontWeight: '800', color: '#475569', whiteSpace: 'nowrap' }}>Actividad</th>
                                                                {RATING_LABELS.map(cc => (
                                                                    <th key={cc} style={{ padding: '0.4rem 0.4rem', textAlign: 'center', fontWeight: '800', color: '#475569', fontSize: '0.85rem' }}>{cc}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {pivotRows.map(r => (
                                                                 <tr key={r.label} style={{ borderBottom: '2px solid #94a3b8' }}>
                                                                     <td style={{ padding: '0.35rem 0.6rem', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{r.label}</td>
                                                                    {r.values.map((v, vi) => {
                                                                        const pct = pivotGrandTotal > 0 ? ((v / pivotGrandTotal) * 100).toFixed(1) : '0.0';
                                                                        return (
                                                                            <td key={vi} style={{ padding: '0.35rem 0.4rem', textAlign: 'center', fontWeight: '700', color: v > 0 ? '#1e293b' : '#cbd5e1', fontSize: '0.85rem' }}>
                                                                                {pct.replace('.', ',')}%
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr style={{ background: '#f8fafc', fontWeight: '900', borderTop: '2px solid #e2e8f0' }}>
                                                                <td style={{ padding: '0.4rem 0.6rem', color: '#1e293b', fontSize: '0.85rem' }}>TOTAL GENERAL</td>
                                                                {pivotCrossTotals.map((ct, ci) => {
                                                                    const pct = pivotGrandTotal > 0 ? ((ct / pivotGrandTotal) * 100).toFixed(2) : '0.00';
                                                                    return <td key={ci} style={{ padding: '0.4rem 0.4rem', textAlign: 'center', color: '#1e293b', fontSize: '0.85rem' }}>{pct.replace('.', ',')}%</td>;
                                                                })}
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    })()
                                    )}

                                    </>
                                ) : s.type === 'metric' && s.rubroValues && s.rubroValues.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--primary-light)', borderRadius: '1rem', padding: '1.5rem' }}>
                                            <div style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--primary)' }}>{s.total}</div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Total empleados</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>{s.respuestas} respuestas</div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '0.8rem', color: '#1e293b', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Empleados por Rubro</div>
                                            {s.rubroValues.map(r => {
                                                const maxVal = Math.max(...s.rubroValues.map(x => x.sum), 1);
                                                const bw = (r.sum / maxVal) * 100;
                                                const barW = Math.max(bw, 8);
                                                return (
                                                    <div key={r.sector} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                                                        <span style={{ minWidth: '100px', fontSize: '0.75rem', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sector}</span>
                                                        <div style={{ flex: 1, height: '18px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${barW}%`, height: '100%', background: '#8b5cf6', borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: bw < 12 ? '0' : '6px', justifyContent: bw < 12 ? 'flex-end' : 'flex-start', paddingRight: bw < 12 ? '4px' : '0' }}>
                                                                {bw >= 12 ? (
                                                                    <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'white' }}>{r.sum}</span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                        {bw < 12 ? (
                                                            <span style={{ minWidth: '20px', fontSize: '0.65rem', fontWeight: '800', color: '#1e293b' }}>{r.sum}</span>
                                                        ) : null}
                                                        <span style={{ minWidth: '30px', fontSize: '0.7rem', fontWeight: '700', color: '#6b7280' }}>({r.avg.toFixed(1)})</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--primary-light)', borderRadius: '1rem' }}>
                                        <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary)' }}>{s.total}</div>
                                        <div style={{ fontWeight: '600', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Total empleados</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>{s.respuestas} respuestas</div>
                                    </div>
                                )}
                            </div>
                        ));
                    })()}
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal (Hidden Charts) */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(12px)',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '2rem', paddingBottom: '2rem', zIndex: 9999, overflowY: 'auto'
        }}>
          <div className="glass-card animate-slide-up" style={{ width: '90%', maxWidth: '600px', background: 'white', borderRadius: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <Settings2 size={24} /> Administrar Gráficos Ocultos
              </h2>
              <p style={{ margin: '0.5rem 0 0', color: '#cbd5e1', fontSize: '0.9rem' }}>Restaura los gráficos que hayas ocultado del dashboard principal.</p>
            </div>
            <div style={{ padding: '2rem' }}>
              {hiddenCharts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No tienes gráficos ocultos actualmente.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {hiddenCharts.map(id => {
                    const s = stats[id];
                    if (!s) return null;
                    return (
                      <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '0.8rem', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: '600', color: '#1e293b', lineHeight: '1.4' }}>{s.label}</span>
                        <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.4rem 1rem', borderRadius: '0.5rem', whiteSpace: 'nowrap' }} 
                            onClick={() => toggleHideChart(id)}
                        >
                            Restaurar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowSettingsModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Selection Modal */}
      {showPdfModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(12px)',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '2rem', paddingBottom: '2rem', zIndex: 9999, overflowY: 'auto'
        }}>
          <div className="animate-slide-up" style={{
            background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0',
            width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column', margin: '0 auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Seleccionar Gráficos para PDF</h3>
                <button onClick={() => setShowPdfModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button className="btn btn-outline btn-small" onClick={() => {
                    const allTrue = { 'rubros': true, 'iva': true };
                    Object.keys(stats).forEach(id => allTrue[`q_${id}`] = true);
                    setPdfSelection(allTrue);
                }} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Seleccionar Todos</button>
                <button className="btn btn-outline btn-small" onClick={() => {
                    const allFalse = { 'rubros': false, 'iva': false };
                    Object.keys(stats).forEach(id => allFalse[`q_${id}`] = false);
                    setPdfSelection(allFalse);
                }} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Deseleccionar Todos</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontWeight: '700', color: '#475569', fontSize: '1.1rem', marginTop: '0.5rem' }}>Generales</div>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', padding: '0.8rem', background: '#f8fafc', borderRadius: '0.8rem', margin: 0, border: '1px solid #e2e8f0' }}>
                    <input type="checkbox" checked={pdfSelection['rubros'] || false} 
                           onChange={(e) => setPdfSelection({...pdfSelection, 'rubros': e.target.checked})}
                           style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)', cursor: 'pointer' }} />
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>Distribución de Participantes por Rubro</span>
                </label>
                
                {ivaStats && ivaStats.length > 0 && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', padding: '0.8rem', background: '#f8fafc', borderRadius: '0.8rem', margin: 0, border: '1px solid #e2e8f0' }}>
                        <input type="checkbox" checked={pdfSelection['iva'] || false} 
                               onChange={(e) => setPdfSelection({...pdfSelection, 'iva': e.target.checked})}
                               style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)', cursor: 'pointer' }} />
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>Situación ante el IVA</span>
                    </label>
                )}

                {(() => {
                    const allStats = Object.entries(stats).filter(([id, s]) => !hiddenCharts.includes(id) && !(s.label || '').toLowerCase().includes('seleccione su actividad económica'));
                    const sortedStats = [...allStats].sort((a, b) => {
                        const indexA = chartOrder.indexOf(a[0]);
                        const indexB = chartOrder.indexOf(b[0]);
                        if (indexA === -1 && indexB === -1) return 0;
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                    });
                    
                    if (sortedStats.length === 0) return null;
                    return (
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{ fontWeight: '700', color: '#475569', fontSize: '1.1rem', marginBottom: '0.8rem' }}>Gráficos</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {sortedStats.map(([id, s]) => (
                                    <label key={id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', cursor: 'pointer', padding: '0.8rem', background: '#f8fafc', borderRadius: '0.8rem', margin: 0, border: '1px solid #e2e8f0' }}>
                                        <input type="checkbox" checked={pdfSelection[`q_${id}`] || false} 
                                               onChange={(e) => setPdfSelection({...pdfSelection, [`q_${id}`]: e.target.checked})}
                                               style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)', cursor: 'pointer', marginTop: '0.2rem' }} />
                                        <span style={{ fontWeight: '600', color: '#1e293b', lineHeight: '1.4' }}>{s.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button className="btn btn-outline" onClick={() => setShowPdfModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={executePrint}>
                    <Download size={20} /> Generar PDF
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
