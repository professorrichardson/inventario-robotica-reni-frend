import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';


// Usar variável de ambiente para a URL da API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5010/api';
const APP_NAME = process.env.REACT_APP_APP_NAME || 'Inventário Robótica';

function App() {
  const [componentes, setComponentes] = useState([]);
  const [componenteEdit, setComponenteEdit] = useState({ componente: '', quantidade: '' });
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  
  // Estados para controlar os modais
  const [modalAberto, setModalAberto] = useState(null); // 'adicionar', 'editar', 'importar', 'acoes'
  const [editandoId, setEditandoId] = useState(null);
  const [componenteSelecionado, setComponenteSelecionado] = useState(null);

  // Carregar componentes ao iniciar
  useEffect(() => {
    carregarComponentes();
  }, []);

  const carregarComponentes = async () => {
    try {
      const response = await axios.get(`${API_URL}/componentes`);
      setComponentes(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar componentes:', error);
      setMensagem('Erro ao carregar componentes');
    }
  };

  // Função para abrir modais
  const abrirModal = (tipo, componente = null) => {
    if (componente) {
      setComponenteEdit(componente);
      setEditandoId(componente.id);
    } else {
      setComponenteEdit({ componente: '', quantidade: '' });
      setEditandoId(null);
    }
    setModalAberto(tipo);
  };

  // Função para abrir modal de ações (mobile)
  const abrirModalAcoes = (componente) => {
    setComponenteSelecionado(componente);
    setModalAberto('acoes');
  };

  // Função para fechar modais
  const fecharModal = () => {
    setModalAberto(null);
    setComponenteEdit({ componente: '', quantidade: '' });
    setEditandoId(null);
    setCsvFile(null);
    setComponenteSelecionado(null);
  };

  // Adicionar componente
  const adicionarComponente = async (e) => {
    e.preventDefault();
    if (!componenteEdit.componente || !componenteEdit.quantidade) {
      setMensagem('Preencha todos os campos');
      return;
    }

    try {
      await axios.post(`${API_URL}/componentes`, componenteEdit);
      setMensagem('Componente adicionado com sucesso!');
      fecharModal();
      carregarComponentes();
    } catch (error) {
      console.error('Erro ao adicionar componente:', error);
      setMensagem('Erro ao adicionar componente');
    }
  };

  // Editar componente
  const editarComponente = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/componentes/${editandoId}`, componenteEdit);
      setMensagem('Componente atualizado com sucesso!');
      fecharModal();
      carregarComponentes();
    } catch (error) {
      console.error('Erro ao editar componente:', error);
      setMensagem('Erro ao editar componente');
    }
  };

  // Excluir componente
  const excluirComponente = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este componente?')) {
      try {
        await axios.delete(`${API_URL}/componentes/${id}`);
        setMensagem('Componente excluído com sucesso!');
        fecharModal();
        carregarComponentes();
      } catch (error) {
        console.error('Erro ao excluir componente:', error);
        setMensagem('Erro ao excluir componente');
      }
    }
  };

  // Importar CSV
  const importarCSV = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setMensagem('Selecione um arquivo CSV');
      return;
    }

    setCarregando(true);
    const formData = new FormData();
    formData.append('csvFile', csvFile);

    try {
      const response = await axios.post(`${API_URL}/importar-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      });
      
      let mensagemSucesso = `✅ CSV importado com sucesso! ${response.data.inseridos} itens adicionados.`;
      if (response.data.erros > 0) {
        mensagemSucesso += ` ${response.data.erros} erros.`;
      }
      
      setMensagem(mensagemSucesso);
      fecharModal();
      carregarComponentes();
    } catch (error) {
      console.error('Erro ao importar CSV:', error);
      
      let mensagemErro = '❌ Erro ao importar CSV';
      if (error.response?.data?.error) {
        mensagemErro = `❌ ${error.response.data.error}`;
      }
      
      setMensagem(mensagemErro);
    } finally {
      setCarregando(false);
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
            <h1>🤖 {APP_NAME}</h1>
          <p>Controle de componentes e materiais</p>
        </div>
      </header>

      <div className="container">
        {mensagem && (
          <div className={`mensagem ${mensagem.includes('❌') ? 'erro' : 'sucesso'}`} onClick={() => setMensagem('')}>
            {mensagem} <span className="fechar">×</span>
          </div>
        )}

        {/* Barra de Ações */}
        <div className="barra-acoes">
          <button 
            className="btn btn-primary"
            onClick={() => abrirModal('adicionar')}
          >
            ➕ Adicionar Componente
          </button>
          <button 
            className="btn btn-success"
            onClick={() => abrirModal('importar')}
          >
            📁 Importar CSV
          </button>
        </div>

        {/* Painel do Inventário */}
        <div className="painel-inventario">
          <div className="painel-header">
            <h2>📦 Inventário Atual</h2>
            <span className="badge">{componentes.length} itens</span>
          </div>
          
          {componentes.length === 0 ? (
            <div className="vazio">
              <div className="vazio-icon">📋</div>
              <h3>Nenhum componente cadastrado</h3>
              <p>Comece adicionando um componente manualmente ou importando um CSV.</p>
            </div>
          ) : (
            <div className="tabela-container">
              <table className="tabela-inventario">
                <thead>
                  <tr>
                    <th>Componente</th>
                    <th>Quantidade</th>
                    <th className="acoes-header desktop-only">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {componentes.map((item) => (
                    <tr key={item.id}>
                      <td 
                        className="componente-nome clickable"
                        onClick={() => abrirModalAcoes(item)}
                      >
                        {item.componente}
                      </td>
                      <td className="quantidade">
                        <span className={`quantidade-badge ${item.quantidade === 0 ? 'zero' : item.quantidade < 5 ? 'baixa' : ''}`}>
                          {item.quantidade}
                        </span>
                      </td>
                      <td className="acoes desktop-only">
                        <button 
                          className="btn btn-editar"
                          onClick={() => abrirModal('editar', item)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-excluir"
                          onClick={() => excluirComponente(item.id)}
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Adicionar Componente */}
        {modalAberto === 'adicionar' && (
          <div className="modal-overlay" onClick={fecharModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>➕ Adicionar Novo Componente</h3>
                <button className="btn-fechar" onClick={fecharModal}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={adicionarComponente}>
                  <div className="form-group">
                    <label htmlFor="componente">Nome do Componente:</label>
                    <input
                      type="text"
                      id="componente"
                      value={componenteEdit.componente}
                      onChange={(e) => setComponenteEdit({...componenteEdit, componente: e.target.value})}
                      placeholder="Ex: Arduino Uno, Sensor Ultrassônico..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="quantidade">Quantidade:</label>
                    <input
                      type="number"
                      id="quantidade"
                      value={componenteEdit.quantidade}
                      onChange={(e) => setComponenteEdit({...componenteEdit, quantidade: e.target.value})}
                      min="0"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="submit" className="btn btn-primary">Adicionar</button>
                    <button type="button" className="btn btn-secondary" onClick={fecharModal}>Cancelar</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Componente */}
        {modalAberto === 'editar' && (
          <div className="modal-overlay" onClick={fecharModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>✏️ Editar Componente</h3>
                <button className="btn-fechar" onClick={fecharModal}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={editarComponente}>
                  <div className="form-group">
                    <label htmlFor="componente-edit">Nome do Componente:</label>
                    <input
                      type="text"
                      id="componente-edit"
                      value={componenteEdit.componente}
                      onChange={(e) => setComponenteEdit({...componenteEdit, componente: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="quantidade-edit">Quantidade:</label>
                    <input
                      type="number"
                      id="quantidade-edit"
                      value={componenteEdit.quantidade}
                      onChange={(e) => setComponenteEdit({...componenteEdit, quantidade: e.target.value})}
                      min="0"
                      required
                    />
                  </div>
                  
                  {/* Informação da última alteração */}
                  <div className="info-alteracao">
                    <p><strong>Última alteração:</strong> {formatarData(componenteEdit.data_cadastro)}</p>
                  </div>
                  
                  <div className="modal-actions">
                    <button type="submit" className="btn btn-primary">Atualizar</button>
                    <button type="button" className="btn btn-secondary" onClick={fecharModal}>Cancelar</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ações (Mobile) */}
        {modalAberto === 'acoes' && componenteSelecionado && (
          <div className="modal-overlay" onClick={fecharModal}>
            <div className="modal modal-acoes" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>🔧 {componenteSelecionado.componente}</h3>
                <button className="btn-fechar" onClick={fecharModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="info-componente">
                  <div className="info-item">
                    <span className="info-label">Quantidade:</span>
                    <span className={`info-value ${componenteSelecionado.quantidade === 0 ? 'zero' : componenteSelecionado.quantidade < 5 ? 'baixa' : ''}`}>
                      {componenteSelecionado.quantidade}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Cadastrado em:</span>
                    <span className="info-value">{formatarData(componenteSelecionado.data_cadastro)}</span>
                  </div>
                </div>
                
                <div className="acoes-mobile">
                  <button 
                    className="btn btn-primary btn-large"
                    onClick={() => {
                      fecharModal();
                      abrirModal('editar', componenteSelecionado);
                    }}
                  >
                    ✏️ Editar Componente
                  </button>
                  <button 
                    className="btn btn-excluir btn-large"
                    onClick={() => {
                      fecharModal();
                      excluirComponente(componenteSelecionado.id);
                    }}
                  >
                    🗑️ Excluir Componente
                  </button>
                  <button 
                    className="btn btn-secondary btn-large"
                    onClick={fecharModal}
                  >
                    ↩️ Voltar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Importar CSV */}
        {modalAberto === 'importar' && (
          <div className="modal-overlay" onClick={fecharModal}>
            <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📁 Importar Componentes via CSV</h3>
                <button className="btn-fechar" onClick={fecharModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="info-csv">
                  <h4>📋 Formato do CSV:</h4>
                  <ul>
                    <li><strong>Coluna 1:</strong> Componente (nome do item)</li>
                    <li><strong>Coluna 2:</strong> Quantidade (número)</li>
                    <li><strong>Formato esperado:</strong></li>
                  </ul>
                  <div className="csv-example">
                    <pre>
                      {`Componente,Quantidade\nArduino Uno,15\nSensor Ultrassônico,25\nLED Vermelho,100`}
                    </pre>
                  </div>
                </div>

                <form onSubmit={importarCSV}>
                  <div className="form-group">
                    <label htmlFor="csvFile" className="file-label">
                      <div className="file-upload-area">
                        {csvFile ? (
                          <>
                            <div className="file-selected">✅</div>
                            <div className="file-info">
                              <strong>{csvFile.name}</strong>
                              <span>{(csvFile.size / 1024).toFixed(2)} KB</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="file-placeholder">📁</div>
                            <div className="file-instructions">
                              <strong>Clique para selecionar o arquivo</strong>
                              <span>ou arraste e solte aqui</span>
                            </div>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        id="csvFile"
                        accept=".csv,text/csv"
                        onChange={(e) => setCsvFile(e.target.files[0])}
                        style={{ display: 'none' }}
                        required
                      />
                    </label>
                  </div>
                  
                  <div className="modal-actions">
                    <button 
                      type="submit" 
                      className="btn btn-success"
                      disabled={carregando || !csvFile}
                    >
                      {carregando ? (
                        <>
                          <span className="spinner"></span>
                          Importando...
                        </>
                      ) : (
                        '🚀 Importar CSV'
                      )}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={fecharModal}>Cancelar</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;