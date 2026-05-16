'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function PatientRecordPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // Estados Interativos
  const [notes, setNotes] = useState([
    { date: '10/04/2026', text: 'Paciente relatou melhora com medicação atual. Manter acompanhamento mensal.' },
    { date: '15/03/2026', text: 'Solicitado ECG de urgência — dor torácica recorrente nas últimas 2 semanas.' }
  ]);
  const [isWritingNote, setIsWritingNote] = useState(false);
  const [newNote, setNewNote] = useState('');

  const [medications, setMedications] = useState([
    { name: 'Losartana 50mg', freq: '1x/dia', since: 'Jan/2026' },
    { name: 'Atenolol 25mg', freq: '2x/dia', since: 'Mar/2025' }
  ]);

  const [files, setFiles] = useState([
    { id: 'f1', name: 'Hemograma_2026.pdf', date: '10/04/2026', size: '245 KB', type: 'pdf' },
    { id: 'f2', name: 'ECG_marco.pdf', date: '15/03/2026', size: '1.2 MB', type: 'pdf' }
  ]);

  const [prescriptions, setPrescriptions] = useState([
    { type: 'Laudo Cardiológico', date: '10/04/2026', status: 'Emitido', signed: true, print: false },
    { type: 'Receituário', date: '15/03/2026', status: 'Emitido', signed: true, print: true }
  ]);

  // Drag and Drop e IA
  const [aiStatus, setAiStatus] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);

  // Modais
  const [showMedModal, setShowMedModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [medForm, setMedForm] = useState({ name: '', freq: '' });
  const [prescriptionText, setPrescriptionText] = useState('Receituário Padrão\n\nPaciente: Maria Santos\n\nPrescrição:\n1. \n\n\nAssinatura: Dr. Silva');

  // Handlers de Anotações
  const handleAddNote = () => {
    if (newNote.trim() !== '') {
      setNotes([{ date: new Date().toLocaleDateString('pt-BR'), text: newNote }, ...notes]);
    }
    setNewNote('');
    setIsWritingNote(false);
  };

  // Handlers de Arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = {
        id: Math.random().toString(),
        name: e.target.files[0].name,
        date: new Date().toLocaleDateString('pt-BR'),
        size: (e.target.files[0].size / 1024).toFixed(0) + ' KB',
        type: e.target.files[0].name.endsWith('.pdf') ? 'pdf' : 'img'
      };
      setFiles([...files, newFile]);
    }
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData('text/plain', fileId);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const fileId = e.dataTransfer.getData('text');
    if (fileId && files.find(f => f.id === fileId)) {
      triggerAiAnalysis();
    }
  };
  const triggerAiAnalysis = () => {
    setAiStatus('analyzing');
    setTimeout(() => setAiStatus('done'), 2000); // Fake delay
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
      
      {/* Modais Baseados em CSS */}
      {showMedModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '400px', backgroundColor: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Adicionar Remédio</h3>
            <input type="text" placeholder="Nome do medicamento (ex: Losartana 50mg)" value={medForm.name} onChange={e => setMedForm({...medForm, name: e.target.value})} style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }} />
            <input type="text" placeholder="Frequência (ex: 8/8h)" value={medForm.freq} onChange={e => setMedForm({...medForm, freq: e.target.value})} style={{ width: '100%', padding: '0.8rem', marginBottom: '1.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }} />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowMedModal(false)} style={{ padding: '0.6rem 1rem', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={() => { setMedications([...medications, { name: medForm.name, freq: medForm.freq, since: 'Hoje' }]); setShowMedModal(false); setMedForm({name:'', freq:''}); }} style={{ padding: '0.6rem 1.5rem', borderRadius: '6px', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showPrescriptionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '600px', backgroundColor: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Nova Prescrição</h3>
            <textarea value={prescriptionText} onChange={e => setPrescriptionText(e.target.value)} style={{ width: '100%', height: '300px', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', resize: 'none', fontFamily: 'monospace' }} />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setShowPrescriptionModal(false)} style={{ padding: '0.6rem 1rem', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={() => { setPrescriptions([{ type: 'Receituário (Template)', date: new Date().toLocaleDateString('pt-BR'), status: 'Emitido', signed: true, print: true }, ...prescriptions]); setShowPrescriptionModal(false); }} style={{ padding: '0.6rem 1.5rem', borderRadius: '6px', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🔐 Emitir e Assinar</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Back + Patient Header ─── */}
      <div>
        <span onClick={() => router.back()} style={{ fontSize: '0.9rem', color: 'var(--color-accent)', cursor: 'pointer', display: 'inline-block', marginBottom: '0.8rem', fontWeight: 500 }}>
          ← Voltar para pacientes
        </span>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(30, 58, 138, 0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>M</span>
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Maria Santos</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>45 anos • Feminino • Cardiologia</p>
          </div>
          <div style={{ padding: '0.3rem 0.8rem', borderRadius: '8px', backgroundColor: 'var(--badge-blue-bg)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--badge-blue-text)' }}>Ativo</span>
          </div>
        </div>
      </div>

      {/* ─── Two-column layout ─── */}
      <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-start' }}>
        
        {/* Left Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Contact Info */}
          <section className="glass-panel" style={{ padding: '1.2rem', backgroundColor: 'var(--bg-card)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>📋 Informações</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[{ label: 'Telefone', value: '(11) 99999-0000' }, { label: 'Email', value: 'maria.s@email.com' }, { label: 'Convênio', value: 'Unimed' }, { label: 'Última consulta', value: '10/04/2026' }].map(f => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{f.label}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Allergies */}
          <section className="glass-panel" style={{ padding: '1.2rem', backgroundColor: 'var(--bg-card)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>⚠️ Alergias</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['Dipirona', 'Penicilina', 'Ibuprofeno'].map(a => (
                <div key={a} style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', backgroundColor: 'var(--badge-red-bg)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--badge-red-text)' }}>{a}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Medication Control */}
          <section className="glass-panel" style={{ padding: '1.2rem', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>💊 Remédios em Uso</h2>
              <button onClick={() => setShowMedModal(true)} style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', backgroundColor: 'var(--badge-blue-bg)', border: 'none', color: 'var(--badge-blue-text)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                + Adicionar
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {medications.map(med => (
                <div key={med.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem', borderRadius: '6px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{med.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', backgroundColor: 'var(--badge-blue-bg)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--badge-blue-text)' }}>{med.freq}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>desde {med.since}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Consultations */}
          <section className="glass-panel" style={{ padding: '1.2rem', backgroundColor: 'var(--bg-card)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>🕐 Últimas Consultas</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { date: '10/04', summary: 'Retorno — Avaliação de exames', doc: 'Dr. Silva' },
                { date: '15/03', summary: 'Consulta — Dor torácica', doc: 'Dr. Silva' }
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.8rem 0', borderBottom: i === 0 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ width: '4px', borderRadius: '4px', backgroundColor: 'var(--color-accent)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-accent)' }}>{c.date}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.doc}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Notes */}
          <section className="glass-panel" style={{ padding: '1.2rem', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>📝 Anotações</h2>
              <button onClick={() => setIsWritingNote(!isWritingNote)} style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', backgroundColor: 'var(--badge-blue-bg)', border: 'none', color: 'var(--badge-blue-text)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                {isWritingNote ? 'Cancelar' : '+ Nova'}
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {notes.map((note, i) => (
                <div key={i} style={{ padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)', display: 'block', marginBottom: '0.3rem' }}>{note.date}</span>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{note.text}</p>
                </div>
              ))}
            </div>

            {isWritingNote && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea 
                  value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Escreva uma evolução médica..."
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', minHeight: '80px' }}
                />
                <button onClick={handleAddNote} style={{ alignSelf: 'flex-end', padding: '0.5rem 1.2rem', borderRadius: '6px', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                  Enviar
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Files & Documents */}
          <section className="glass-panel" style={{ padding: '1.2rem', backgroundColor: 'var(--bg-card)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>📁 Arquivos e Exames</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {files.map(f => (
                <div 
                  key={f.id} 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, f.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem', borderRadius: '6px', cursor: 'grab', backgroundColor: 'var(--bg-app)' }}
                  title="Segure e arraste para a IA analisar"
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--badge-blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.2rem' }}>{f.type === 'pdf' ? '📄' : '🖼️'}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.date} • {f.size}</span>
                  </div>
                </div>
              ))}
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
            <div onClick={() => fileInputRef.current?.click()} style={{ marginTop: '1rem', padding: '1rem', borderRadius: '6px', border: '1px dashed var(--text-muted)', textAlign: 'center', cursor: 'pointer', backgroundColor: 'var(--bg-app)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📎 Clique para enviar um arquivo</span>
            </div>
          </section>

          {/* Prescriptions */}
          <section className="glass-panel" style={{ padding: '1.2rem', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>📝 Prescrições e Laudos</h2>
              <button onClick={() => setShowPrescriptionModal(true)} style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', backgroundColor: 'var(--badge-blue-bg)', border: 'none', color: 'var(--badge-blue-text)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                + Novo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {prescriptions.map((doc, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: i < prescriptions.length -1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{doc.type}</span>
                      {doc.signed && (
                        <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--badge-purple-bg)', fontSize: '0.7rem', fontWeight: 600, color: 'var(--badge-purple-text)' }}>
                          🔐 Assinado
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {doc.print && (
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--badge-yellow-bg)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--badge-yellow-text)', cursor: 'pointer' }}>
                        🖨️ Imprimir
                      </span>
                    )}
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', backgroundColor: 'var(--badge-blue-bg)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--badge-blue-text)' }}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div onClick={() => setShowPrescriptionModal(true)} style={{ marginTop: '1rem', padding: '0.8rem', borderRadius: '6px', backgroundColor: 'var(--bg-app)', display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', border: '1px solid transparent', transition: 'border 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
              <span style={{ fontSize: '1.2rem' }}>📋</span>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Template base da clínica</p>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>modelo_prescricao.docx</span>
              </div>
            </div>
          </section>

          {/* AI ECG */}
          <section className="glass-panel" style={{ padding: '1.2rem', backgroundColor: 'var(--bg-card)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>🫀 Análise de IA — ECG</h2>
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => { if (aiStatus === 'idle') aiFileInputRef.current?.click(); }}
              style={{ 
                padding: '1.5rem', borderRadius: '6px', 
                border: `2px dashed ${isDragOver ? 'var(--color-primary)' : 'var(--text-muted)'}`, 
                backgroundColor: isDragOver ? 'var(--badge-blue-bg)' : 'transparent',
                textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' 
              }}
            >
              <input type="file" ref={aiFileInputRef} onChange={(e) => { if(e.target.files?.length) triggerAiAnalysis(); }} style={{ display: 'none' }} />
              
              {aiStatus === 'idle' && (
                <>
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>📊</span>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Arraste um exame aqui</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ou clique para selecionar. A IA fará o resto.</span>
                </>
              )}

              {aiStatus === 'analyzing' && (
                <div style={{ padding: '1rem 0' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary)' }}>Processando Eletrocardiograma com IA...</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Isso pode levar alguns segundos.</span>
                </div>
              )}

              {aiStatus === 'done' && (
                <div style={{ textAlign: 'left', backgroundColor: 'var(--badge-green-bg)', padding: '1rem', borderRadius: '6px' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--badge-green-text)', marginBottom: '0.5rem' }}>✅ Análise Concluída</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}><strong>Laudo IA:</strong> Ritmo sinusal normal. Sem indícios de isquemia ou hipertrofia ventricular.</p>
                  <button onClick={(e) => { e.stopPropagation(); setAiStatus('idle'); }} style={{ marginTop: '0.8rem', padding: '0.3rem 0.8rem', background: 'transparent', border: '1px solid var(--badge-green-text)', color: 'var(--badge-green-text)', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>Nova Análise</button>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
