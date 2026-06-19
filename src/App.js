import React, { useState, useRef, useEffect } from 'react';

// Datos iniciales de los grupos (Sorteo real del Mundial 2026)
const initialGroupsData = {
  A: ['México', 'Sudáfrica', 'Corea del Sur', 'Chequia'],
  B: ['Canadá', 'Suiza', 'Bosnia y Herzegovina', 'Qatar'],
  C: ['Brasil', 'Marruecos', 'Escocia', 'Haití'],
  D: ['Estados Unidos', 'Australia', 'Turquía', 'Paraguay'],
  E: ['Alemania', 'Costa de Marfil', 'Ecuador', 'Curazao'],
  F: ['Suecia', 'Japón', 'Países Bajos', 'Túnez'],
  G: ['Nueva Zelanda', 'Irán', 'Bélgica', 'Egipto'],
  H: ['Uruguay', 'España', 'Arabia Saudita', 'Cabo Verde'],
  I: ['Noruega', 'Francia', 'Senegal', 'Irak'],
  J: ['Argentina', 'Austria', 'Jordania', 'Argelia'],
  K: ['Colombia', 'RD Congo', 'Portugal', 'Uzbekistán'],
  L: ['Inglaterra', 'Ghana', 'Panamá', 'Croacia'],
};

// Partidos conocidos jugados hasta la fecha actual
const knownResults = {
  'A1': [1, 0], 'A2': [1, 1],
  'B1': [6, 0], 'B2': [4, 1],
  'C1': [1, 1], 'C2': [1, 0],
  'D1': [4, 1], 'D2': [2, 0],
  'E1': [7, 1], 'E2': [1, 0],
  'F1': [5, 1], 'F2': [2, 2],
  'G1': [1, 1], 'G2': [2, 2],
  'H1': [0, 0], 'H2': [1, 1],
  'I1': [3, 1], 'I2': [4, 1],
  'J1': [3, 0], 'J2': [3, 1],
  'K1': [1, 1], 'K2': [3, 1],
  'L1': [4, 2], 'L2': [1, 0],
};

function initGroupMatches() {
  const matches = {};
  for (const [group, teams] of Object.entries(initialGroupsData)) {
    const gMatches = [
      { id: `${group}1`, t1: teams[0], t2: teams[2] },
      { id: `${group}2`, t1: teams[3], t2: teams[1] },
      { id: `${group}3`, t1: teams[0], t2: teams[1] },
      { id: `${group}4`, t1: teams[2], t2: teams[3] },
      { id: `${group}5`, t1: teams[0], t2: teams[3] },
      { id: `${group}6`, t1: teams[1], t2: teams[2] },
    ];
    gMatches.forEach(m => {
      const res = knownResults[m.id];
      matches[m.id] = {
        ...m,
        s1: res ? res[0] : '',
        s2: res ? res[1] : '',
        played: !!res
      };
    });
  }
  return matches;
}

// Lógica de las llaves (Bracket) del árbol
const bracketLinks = {
  17: [1, 2], 18: [3, 4], 19: [5, 6], 20: [7, 8],
  21: [9, 10], 22: [11, 12], 23: [13, 14], 24: [15, 16],
  25: [17, 18], 26: [19, 20], 27: [21, 22], 28: [23, 24],
  29: [25, 26], 30: [27, 28],
  31: [29, 30]
};

// Equipos base pre-clasificados en los Dieciseisavos (según la tabla del día de hoy) para no tener que armarlo desde cero
const defaultR32 = [
  ['México', 'Haití'], ['Canadá', 'Japón'], ['Escocia', 'Túnez'], ['Estados Unidos', 'Bélgica'],
  ['Alemania', 'Irán'], ['Suecia', 'Brasil'], ['Nueva Zelanda', 'Corea del Sur'], ['Uruguay', 'Austria'],
  ['Noruega', 'Paraguay'], ['Argentina', 'Portugal'], ['Colombia', 'Ghana'], ['Inglaterra', 'Costa de Marfil'],
  ['Chequia', 'Sudáfrica'], ['Suiza', 'Australia'], ['España', 'Francia'], ['RD Congo', 'Croacia']
];

function initBracket() {
  const state = {};
  defaultR32.forEach((teams, idx) => {
     state[idx + 1] = { team1: teams[0], team2: teams[1], winner: '' };
  });
  return state;
}

// --- Componentes ---

const TeamRow = ({ team, isWinner, isLeaf, allTeams, onSelect, onClick }) => {
  return (
    <div 
      className={`flex items-center justify-between p-1 px-2 rounded cursor-pointer transition-all border shadow-sm ${
        isWinner ? 'bg-green-700/80 border-green-400 font-bold shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-800/90 border-gray-600 hover:bg-gray-700/90'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 w-full overflow-hidden">
        <div className={`w-4 h-4 rounded-full border border-gray-400 flex-shrink-0 flex items-center justify-center ${isWinner ? 'bg-white' : ''}`}>
           {isWinner && <div className="w-2 h-2 bg-green-600 rounded-full"></div>}
        </div>
        {isLeaf ? (
           <select 
             value={team} 
             onChange={(e) => onSelect(e.target.value)}
             onClick={(e) => e.stopPropagation()}
             className="bg-transparent text-white outline-none w-full cursor-pointer flex-1 appearance-none text-sm font-semibold truncate"
           >
             <option value="" className="text-black">-- Vacante --</option>
             {Object.entries(allTeams).map(([group, teams]) => (
                <optgroup key={group} label={`Grupo ${group}`} className="text-black bg-gray-200">
                  {teams.map(t => <option key={t} value={t}>{t}</option>)}
                </optgroup>
             ))}
           </select>
        ) : (
           <span className="truncate flex-1 select-none text-sm font-semibold">{team || 'Por definir...'}</span>
        )}
      </div>
    </div>
  );
};

const BracketNode = ({ matchId, bracketState, handleWin, handleSelect, allTeams }) => {
  const isLeaf = matchId <= 16;
  const matchState = bracketState[matchId] || { team1: '', team2: '', winner: '' };
  
  let team1 = matchState.team1;
  let team2 = matchState.team2;

  if (!isLeaf) {
    const child1 = bracketState[bracketLinks[matchId][0]] || {};
    const child2 = bracketState[bracketLinks[matchId][1]] || {};
    team1 = child1.winner || '';
    team2 = child2.winner || '';
  }

  const getRoundName = (id) => {
    if (id === 31) return 'LA FINAL';
    if (id >= 29) return 'SEMIFINALES';
    if (id >= 25) return 'CUARTOS';
    if (id >= 17) return 'OCTAVOS';
    return '16AVOS';
  };

  return (
    <div className="flex flex-col items-center min-w-max px-1 md:px-2">
      {/* Ramas Superiores (Conectores hacia los hijos) */}
      {!isLeaf && (
        <div className="flex w-full justify-center">
          <div className="flex flex-col items-center w-1/2">
            <BracketNode matchId={bracketLinks[matchId][0]} bracketState={bracketState} handleWin={handleWin} handleSelect={handleSelect} allTeams={allTeams} />
            <div className="h-6 md:h-8 w-1/2 border-r-2 border-b-2 border-yellow-400/60 rounded-br-lg" style={{ marginLeft: '50%' }}></div>
          </div>
          <div className="flex flex-col items-center w-1/2">
            <BracketNode matchId={bracketLinks[matchId][1]} bracketState={bracketState} handleWin={handleWin} handleSelect={handleSelect} allTeams={allTeams} />
            <div className="h-6 md:h-8 w-1/2 border-l-2 border-b-2 border-yellow-400/60 rounded-bl-lg" style={{ marginRight: '50%' }}></div>
          </div>
        </div>
      )}
      {!isLeaf && <div className="w-px h-6 md:h-8 border-l-2 border-yellow-400/60"></div>}

      {/* Caja del Partido */}
      <div className="z-10 bg-black/80 border border-gray-600 rounded-lg p-2 w-40 md:w-48 shadow-xl backdrop-blur-md relative flex-shrink-0">
        <div className="text-[10px] md:text-xs text-center text-yellow-500 mb-1 font-black tracking-widest uppercase">
           {getRoundName(matchId)}
        </div>
        <div className="flex flex-col gap-1.5">
          <TeamRow
            team={team1}
            isWinner={matchState.winner === team1 && team1 !== ''}
            isLeaf={isLeaf}
            allTeams={allTeams}
            onSelect={(val) => handleSelect(matchId, 'team1', val)}
            onClick={() => { if(team1) handleWin(matchId, team1) }}
          />
          <TeamRow
            team={team2}
            isWinner={matchState.winner === team2 && team2 !== ''}
            isLeaf={isLeaf}
            allTeams={allTeams}
            onSelect={(val) => handleSelect(matchId, 'team2', val)}
            onClick={() => { if(team2) handleWin(matchId, team2) }}
          />
        </div>
      </div>

      {/* Campeón Final */}
      {matchId === 31 && matchState.winner && (
        <div className="flex flex-col items-center mt-2 pb-10">
          <div className="w-px h-8 md:h-12 border-l-2 border-yellow-400"></div>
          <div className="text-4xl md:text-6xl drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]">🏆</div>
          <div className="bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 text-black font-extrabold px-6 py-2 md:px-10 md:py-3 rounded-full text-xl md:text-3xl mt-4 animate-bounce shadow-[0_0_20px_rgba(234,179,8,0.5)] border-2 border-yellow-200">
            {matchState.winner}
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Bracket');

  // Cargar desde localStorage o usar los datos oficiales si no hay nada guardado
  const [matches, setMatches] = useState(() => {
    const saved = localStorage.getItem('mundialMatches');
    return saved ? JSON.parse(saved) : initGroupMatches();
  });

  const [bracket, setBracket] = useState(() => {
    const saved = localStorage.getItem('mundialBracket');
    return saved ? JSON.parse(saved) : initBracket();
  });

  // Guardar en localStorage automáticamente cuando cambian los partidos o el bracket
  useEffect(() => {
    localStorage.setItem('mundialMatches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('mundialBracket', JSON.stringify(bracket));
  }, [bracket]);

  // Función para resetear los datos locales
  const handleReset = () => {
    if (window.confirm("¿Estás seguro de que quieres borrar tus cambios locales y volver a los resultados oficiales?")) {
      localStorage.removeItem('mundialMatches');
      localStorage.removeItem('mundialBracket');
      setMatches(initGroupMatches());
      setBracket(initBracket());
    }
  };

  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState({ startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });

  // Eventos para arrastrar el árbol
  const onMouseDown = (e) => {
    setIsDragging(true);
    setDragState({
      startX: e.pageX - containerRef.current.offsetLeft,
      startY: e.pageY - containerRef.current.offsetTop,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop
    });
  };
  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);
  const onMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const y = e.pageY - containerRef.current.offsetTop;
    containerRef.current.scrollLeft = dragState.scrollLeft - (x - dragState.startX) * 2;
    containerRef.current.scrollTop = dragState.scrollTop - (y - dragState.startY) * 2;
  };

  // Lógica de Grupos
  const calculateStandings = (group, teams, gMatches) => {
    const stats = teams.map(t => ({ name: t, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0 }));
    
    gMatches.forEach(m => {
      if (m.s1 !== '' && m.s2 !== '') {
        const s1 = parseInt(m.s1);
        const s2 = parseInt(m.s2);
        const t1 = stats.find(t => t.name === m.t1);
        const t2 = stats.find(t => t.name === m.t2);
        t1.pj++; t2.pj++;
        t1.gf += s1; t1.gc += s2;
        t2.gf += s2; t2.gc += s1;
        t1.dif = t1.gf - t1.gc;
        t2.dif = t2.gf - t2.gc;
        if (s1 > s2) { t1.pts += 3; t1.pg++; t2.pp++; }
        else if (s1 < s2) { t2.pts += 3; t2.pg++; t1.pp++; }
        else { t1.pts += 1; t2.pts += 1; t1.pe++; t2.pe++; }
      }
    });
    return stats.sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf);
  };

  const handleScoreChange = (id, field, value) => {
    setMatches(prev => {
       const newMatch = { ...prev[id], [field]: value };
       newMatch.played = (newMatch.s1 !== '' && newMatch.s2 !== '');
       return { ...prev, [id]: newMatch };
    });
  };

  // Lógica del Árbol
  const getParentMatch = (childId) => {
    for (const [parent, childs] of Object.entries(bracketLinks)) {
      if (childs[0] === childId) return { id: parseInt(parent), slot: 'team1' };
      if (childs[1] === childId) return { id: parseInt(parent), slot: 'team2' };
    }
    return null;
  };

  const clearDownstream = (state, matchId) => {
    const parentInfo = getParentMatch(matchId);
    if (parentInfo) {
      const pid = parentInfo.id;
      if (state[pid]) {
         state[pid][parentInfo.slot] = '';
         if (state[pid].winner) {
             state[pid].winner = '';
             clearDownstream(state, pid);
         }
      }
    }
  };

  const handleWin = (matchId, team) => {
     if (!team) return;
     setBracket(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        if (!newState[matchId]) newState[matchId] = { team1: '', team2: '', winner: '' };
        
        const isCurrentlyWinner = newState[matchId].winner === team;
        
        if (isCurrentlyWinner) {
           newState[matchId].winner = '';
           clearDownstream(newState, matchId);
        } else {
           newState[matchId].winner = team;
           const parentInfo = getParentMatch(matchId);
           if (parentInfo) {
              const pid = parentInfo.id;
              if (!newState[pid]) newState[pid] = { team1: '', team2: '', winner: '' };
              newState[pid][parentInfo.slot] = team;
              if (newState[pid].winner && newState[pid].winner !== team) {
                 newState[pid].winner = '';
                 clearDownstream(newState, pid);
              }
           }
        }
        return newState;
     });
  };

  const handleSelect = (matchId, slot, value) => {
     setBracket(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        if (!newState[matchId]) newState[matchId] = { team1: '', team2: '', winner: '' };
        newState[matchId][slot] = value;
        if (newState[matchId].winner) {
            newState[matchId].winner = '';
            clearDownstream(newState, matchId);
        }
        return newState;
     });
  };

  return (
    <div className="min-h-screen text-white font-sans flex flex-col relative select-none">
      {/* Background and Overlays */}
      <div className="fixed inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518605368461-1ee7e53f1f3e?auto=format&fit=crop&q=80')" }}></div>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-blue-900/90 via-slate-900/95 to-black"></div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .tree-container { cursor: grab; }
        .tree-container:active { cursor: grabbing; }
      `}</style>

      <div className="z-10 flex flex-col h-screen">
        {/* Encabezado y Pestañas */}
        <header className="pt-4 pb-2 bg-black/60 shadow-lg border-b border-gray-800 backdrop-blur-sm flex-shrink-0 relative">
          
          {/* Botón de Restaurar */}
          <div className="absolute top-2 right-4 md:top-4 md:right-6">
             <button 
               onClick={handleReset}
               className="bg-red-700/80 hover:bg-red-600 text-white text-[10px] md:text-xs font-bold py-1 md:py-1.5 px-2 md:px-3 rounded shadow-lg transition-colors border border-red-500 flex items-center gap-1"
               title="Eliminar datos locales y volver a la versión oficial"
             >
               <span>🗑️</span> <span className="hidden md:inline">Restaurar Datos</span>
             </button>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-center text-yellow-400 drop-shadow-md mb-4 uppercase tracking-wide">
             🏆 Tablero Mundial 2026
          </h1>
          <div className="flex overflow-x-auto gap-2 px-4 hide-scrollbar justify-start md:justify-center">
            <button 
              onClick={() => setActiveTab('Bracket')} 
              className={`whitespace-nowrap px-5 py-2 rounded-lg font-bold transition-all ${activeTab === 'Bracket' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
            >
              🌳 Fase Eliminatoria
            </button>
            <div className="w-px h-8 bg-gray-600 self-center mx-2"></div>
            {Object.keys(initialGroupsData).map(g => (
               <button 
                 key={g} 
                 onClick={() => setActiveTab(g)} 
                 className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold transition-all ${activeTab === g ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
               >
                 Grupo {g}
               </button>
            ))}
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="flex-1 relative overflow-hidden flex">
            { activeTab === 'Bracket' ? (
               <div 
                 ref={containerRef}
                 className="tree-container overflow-auto w-full h-full p-4 md:p-8 hide-scrollbar"
                 onMouseDown={onMouseDown} onMouseLeave={onMouseLeave} onMouseUp={onMouseUp} onMouseMove={onMouseMove}
               >
                 <div className="w-max mx-auto pb-32 pt-4">
                    <BracketNode matchId={31} bracketState={bracket} handleWin={handleWin} handleSelect={handleSelect} allTeams={initialGroupsData} />
                 </div>
               </div>
            ) : (
               <div className="w-full h-full overflow-auto p-4 md:p-8">
                  <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6">
                    {/* Tabla de Posiciones */}
                    <div className="flex-1 bg-black/70 p-5 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-md">
                      <h3 className="text-2xl font-black mb-4 text-yellow-400">Posiciones Grupo {activeTab}</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-center">
                          <thead>
                            <tr className="text-gray-400 border-b border-gray-600 uppercase text-xs">
                              <th className="text-left py-3">Equipo</th>
                              <th>PTS</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DIF</th>
                            </tr>
                          </thead>
                          <tbody>
                            {calculateStandings(activeTab, initialGroupsData[activeTab], Object.values(matches).filter(m => m.id.startsWith(activeTab))).map((t, idx) => (
                              <tr key={t.name} className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${idx < 2 ? 'bg-green-900/20' : ''}`}>
                                 <td className="text-left py-3 font-bold flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${idx < 2 ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>{idx + 1}</span> 
                                    <span className="text-base">{t.name}</span>
                                 </td>
                                 <td className="font-black text-yellow-400 text-base">{t.pts}</td>
                                 <td>{t.pj}</td><td>{t.pg}</td><td>{t.pe}</td><td>{t.pp}</td><td>{t.gf}</td><td>{t.gc}</td>
                                 <td className="font-bold">{t.dif > 0 ? `+${t.dif}` : t.dif}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-gray-400 mt-4">* Los 2 primeros y los 8 mejores terceros avanzan a Dieciseisavos.</p>
                    </div>
                    
                    {/* Lista de Partidos */}
                    <div className="flex-1 bg-black/70 p-5 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-md">
                       <h3 className="text-2xl font-black mb-4 text-yellow-400">Partidos</h3>
                       <div className="flex flex-col gap-3">
                          {Object.values(matches).filter(m => m.id.startsWith(activeTab)).map(m => (
                            <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${m.played ? 'bg-blue-900/20 border-blue-800/50' : 'bg-gray-800/60 border-gray-700'}`}>
                               <div className="flex-1 text-right font-bold text-lg truncate pr-2">{m.t1}</div>
                               <div className="flex items-center gap-2 mx-2 bg-black/50 p-1.5 rounded-lg border border-gray-700">
                                  <input 
                                    type="number" min="0" 
                                    value={m.s1} 
                                    onChange={e => handleScoreChange(m.id, 's1', e.target.value)}
                                    className="w-10 h-10 text-center bg-gray-900 border border-gray-600 rounded-md text-yellow-400 outline-none focus:border-yellow-500 font-bold text-lg" 
                                  />
                                  <span className="text-gray-500 font-bold">-</span>
                                  <input 
                                    type="number" min="0" 
                                    value={m.s2} 
                                    onChange={e => handleScoreChange(m.id, 's2', e.target.value)}
                                    className="w-10 h-10 text-center bg-gray-900 border border-gray-600 rounded-md text-yellow-400 outline-none focus:border-yellow-500 font-bold text-lg" 
                                  />
                               </div>
                               <div className="flex-1 text-left font-bold text-lg truncate pl-2">{m.t2}</div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
               </div>
            )}
        </main>
      </div>
    </div>
  );
}
