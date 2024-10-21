import { useState, useContext, createContext, ReactNode, useEffect } from 'react';
import './App.css';
import './index.css';
import ThemeToggleButton from './ThemeToggleButton.tsx';
import { useTheme } from './ThemeContext';

type Priority = "baixa" | "média" | "alta";

type Item = {
  id: number;
  nome: string;
  descricao: string;
  data_criacao: string;
  data_modificacao?: string;
  prioridade: Priority;
};

interface FormContextType {
  nome: string;
  setNome: (value: string) => void;
  descricao: string;
  setDescricao: (value: string) => void;
  prioridade: Priority;
  setPrioridade: (value: Priority) => void;
  editId: number | null;
  setEditId: (value: number | null) => void;
  isValid: boolean;
  validate: () => boolean;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('a função useFormContext deve ser usada dentro de um FormProvider!!');
  }
  return context;
};

export const FormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<Priority>('baixa');
  const [editId, setEditId] = useState<number | null>(null);
  const [isValid, setIsValid] = useState(true);

  const validate = () => {
    const valid = nome.length >= 3 && descricao.length >= 3;
    setIsValid(valid);
    return valid;
  };

  return (
    <FormContext.Provider value={{ nome, setNome, descricao, setDescricao, prioridade, setPrioridade, editId, setEditId, isValid, validate }}>
      {children}
    </FormContext.Provider>
  );
};

function App() {
  const { theme } = useTheme();
  const [items, setItems] = useState<Item[]>(() => {
    const storedItems = localStorage.getItem('items');
    return storedItems ? JSON.parse(storedItems) : [];
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeFilter, setActiveFilter] = useState<'priority' | 'name' | 'date'>('priority');
  const [searchName, setSearchName] = useState('');
  const [showModal, setShowModal] = useState(false); // Estado para controle do modal

  const { nome, setNome, descricao, setDescricao, prioridade, setPrioridade, editId, setEditId, isValid, validate } = useFormContext();

  useEffect(() => {
    localStorage.setItem('items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      document.documentElement.className = storedTheme;
    }
  }, []);

  function addItem() {
    if (!validate()) return;

    const newItem: Item = {
      id: items.length + 1,
      nome,
      descricao,
      data_criacao: new Date().toString(),
      prioridade,
    };
    setItems((prevItems) => [...prevItems, newItem]);
    clearForm();
  }

  function updateItem() {
    if (!validate() || editId === null) return;

    setItems((prevItems) =>
      prevItems.map(item =>
        item.id === editId ? { ...item, nome, descricao, prioridade, data_modificacao: new Date().toString() } : item
      )
    );
    clearForm();
  }

  function clearForm() {
    setNome('');
    setDescricao('');
    setPrioridade('baixa');
    setEditId(null);
    setShowModal(false);
  }

  function deleteItem(id: number) {
    setItems((prevItems) => prevItems.filter(item => item.id !== id));
  }

  function startEdit(item: Item) {
    setNome(item.nome);
    setDescricao(item.descricao);
    setPrioridade(item.prioridade);
    setEditId(item.id);
    setShowModal(true);
  }

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  let filteredItems = items.filter(item =>
    (filterPriority ? item.prioridade === filterPriority : true) &&
    (searchName ? item.nome.toLowerCase().includes(searchName.toLowerCase()) : true)
  );

  if (activeFilter === 'name') {
    filteredItems = filteredItems.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  if (activeFilter === 'date') {
    filteredItems = filteredItems.sort((a, b) => {
      const dateA = new Date(a.data_criacao);
      const dateB = new Date(b.data_criacao);
      return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    });
  }

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className={`border border-red-600 rounded-2xl w-[50%] mx-auto my-auto gap-4 p-4 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'}max-md:relative`}>
      <h1 className='flex items-center justify-center my-2'>Concentrix CRUD Challenge</h1>
      
      <div className='my-4'>
        <button onClick={() => setActiveFilter('priority')} className={`mr-2 ${activeFilter === 'priority' ? 'font-bold' : ''}`}>Filtro por Prioridade</button>
        <button onClick={() => setActiveFilter('name')} className={`mr-2 ${activeFilter === 'name' ? 'font-bold' : ''}`}>Filtro por Nome</button>
        <button onClick={() => setActiveFilter('date')} className={`mr-2 ${activeFilter === 'date' ? 'font-bold' : ''}`}>Filtro por Data</button>
      </div>

      {activeFilter === 'priority' && (
        <div className='flex justify-between'>
          <select 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value as Priority | '')}
            className={`border ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
          >
            <option value="">Todos</option>
            <option value="baixa">Baixa</option>
            <option value="média">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>
      )}

      {activeFilter === 'name' && (
        <div className='flex justify-between'>
          <input 
            type="text" 
            placeholder="Pesquisar por nome" 
            onChange={(e) => setSearchName(e.target.value)}
            className={`border ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
          />
        </div>
      )}

      {activeFilter === 'date' && (
        <div className='flex justify-between'>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className={`border ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
          >
            <option value="asc">Mais Novos</option>
            <option value="desc">Mais Antigos</option>
          </select>
        </div>
      )}

      <div className='flex justify-between'>
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={`border ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
        />
        <input
          type="text"
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className={`border ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
        />
        <select value={prioridade} onChange={(e) => setPrioridade(e.target.value as Priority)}
          className={`border ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} mx-4 my-2`}>
          <option value="baixa">Baixa</option>
          <option value="média">Média</option>
          <option value="alta">Alta</option>
        </select>
        <button onClick={addItem} className={`border ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} `}>
          Adicionar Item
        </button>
        {!isValid && <p className='text-red-600'>Nome e descrição devem ter pelo menos 3 caracteres.</p>}
      </div>

      <ol className='my-4 flex items-center justify-center flex-col'>
        {currentItems.map(item => (
          <li key={item.id}>
            {item.id} {item.nome} - {item.descricao} - ({item.prioridade}) - {item.data_criacao} {item.data_modificacao && `(Modificado em: ${item.data_modificacao})`}
            <button onClick={() => startEdit(item)} className={`border border-blue-600 bg-blue-600 mx-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Editar Item</button>
            <button onClick={() => deleteItem(item.id)} className={`border border-red-600 bg-red-600 mx-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Excluir Item</button>
          </li>
        ))}
      </ol>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className={`bg-white rounded-lg p-4 shadow-lg w-1/3 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
            <h2 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-black' : 'text-black'}`}>Editar Item</h2>
            <input
              type="text"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={`border ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'} w-full mb-2`}
            />
            <input
              type="text"
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={`border ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'} w-full mb-2`}
            />
            <select value={prioridade} onChange={(e) => setPrioridade(e.target.value as Priority)} className={`border ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'} w-full mb-2`}>
              <option value="baixa">Baixa</option>
              <option value="média">Média</option>
              <option value="alta">Alta</option>
            </select>
            <div className="flex justify-between">
              <button onClick={updateItem} className="bg-green-600 text-white rounded px-4 py-2">Atualizar Item</button>
              <button onClick={clearForm} className="bg-red-500 text-white rounded px-4 py-2">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className='flex justify-between my-4'>
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          Anterior
        </button>
        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
          Próxima
        </button>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <FormProvider>
      <ThemeToggleButton />
      <App />
    </FormProvider>
  );
}
