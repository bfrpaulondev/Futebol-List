// -.-.-.-
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@components/layout/Container';
import { Header } from '@components/layout/Header';
import { Button } from '@components/ui/Button';
import { Loader } from '@components/ui/Loader';
import { BalanceCard } from '@components/finance/BalanceCard';
import { MetricsGrid } from '@components/finance/MetricsGrid';
import { TransactionTable } from '@components/finance/TransactionTable';
import { financeService } from '@services/financeService';

// -.-.-.-
export const Finances = () => {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // -.-.-.-
  useEffect(() => {
    loadData();
  }, []);
  
  // -.-.-.-
  const loadData = async () => {
    try {
      const [balanceData, transactionsData] = await Promise.all([
        financeService.getBalance(),
        financeService.getTransactions({ limit: 10 })
      ]);
      
      setBalance(balanceData || { current: 0, mensalistasCount: 0 });
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (error) {
      console.error('[Finances] Failed to load data:', error);
      setBalance({ current: 0, mensalistasCount: 0 });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <Loader fullScreen message="A carregar finanças..." />;
  
  // ## calculate metrics (safe: transactions guaranteed array)
  const entradas = (transactions || [])
    .filter(t => t?.type === 'entrada')
    .reduce((sum, t) => sum + (t?.amount || 0), 0);
    
  const saidas = (transactions || [])
    .filter(t => t?.type === 'saida')
    .reduce((sum, t) => sum + (t?.amount || 0), 0);
  
  return (
    <Container>
      <Header 
        title="Finanças" 
        actions={
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => navigate('/suggestion-form')}
          >
            + Sugestão
          </Button>
        }
      />
      
      <div className="flex flex-col gap-lg" style={{ paddingBottom: '100px' }}>
        {/* Balance */}
        <BalanceCard balance={balance?.current || 0} />
        
        {/* Metrics */}
        <MetricsGrid 
          entradas={entradas}
          saidas={saidas}
          mensalistas={balance?.mensalistasCount || 0}
        />
        
        {/* Transactions */}
        <TransactionTable transactions={transactions} />
      </div>
    </Container>
  );
};
