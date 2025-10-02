import { useState, useMemo, useEffect } from 'react';
import { ActionItem, SuggestedActionItem, ActionStatus, Plan, SavedReport, PlanStatus, NewPlanData } from '../types';
import * as api from '../services/apiService';

// Define the shape of the current user, or import it if it's defined elsewhere.
interface User {
    id: number;
    name: string;
    email: string;
}

// Helper for adding toast messages
type AddToastFunction = (message: string, type?: 'success' | 'error' | 'info') => void;

export const useAppData = (addToast: AddToastFunction) => {
  // State
  const [loading, setLoading] = useState(true);
  const [isOperating, setIsOperating] = useState(false);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [suggestedItems, setSuggestedItems] = useState<SuggestedActionItem[]>([]);

  // Effect to load initial data from the API service
  useEffect(() => {
    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [plansData, reportsData, userData] = await Promise.all([
                api.getPlans(),
                api.getSavedReports(),
                api.getCurrentUser(),
            ]);
            setAllPlans(plansData);
            setSavedReports(reportsData);
            setCurrentUser(userData);
        } catch (error) {
            console.error("Failed to load initial data:", error);
            const message = error instanceof Error 
                ? error.message 
                : "Falha ao carregar os dados. Verifique sua conexão e se o servidor backend está em execução.";
            addToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };
    loadInitialData();
  }, []);

  // Memoized derived state
  const currentPlan = useMemo(() => allPlans.find(p => p.id === currentPlanId) || null, [allPlans, currentPlanId]);
  const actionItems = useMemo(() => currentPlan?.actionItems || [], [currentPlan]);

  // Plan actions
  const selectPlan = (planId: number) => {
    setCurrentPlanId(planId);
  };
  
  const goHome = () => {
    setCurrentPlanId(null);
  };

  const createPlan = async (data: NewPlanData, items: Omit<ActionItem, 'id'>[] = []): Promise<number | undefined> => {
    setIsOperating(true);
    try {
      const newPlan = await api.createPlan(data, items);
      setAllPlans(prevPlans => [...prevPlans, newPlan]);
      addToast('Plano criado com sucesso!', 'success');
      return newPlan.id;
    } catch (error) {
      addToast(`Erro ao criar o plano: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
      return undefined;
    } finally {
      setIsOperating(false);
    }
  };

  const deletePlan = async (planId: number) => {
    setIsOperating(true);
    try {
      await api.deletePlan(planId);
      setAllPlans(prevPlans => prevPlans.filter(p => p.id !== planId));
      setSavedReports(prevReports => prevReports.filter(r => r.planId !== planId));
      addToast('Plano excluído com sucesso.', 'info');
    } catch (error) {
      addToast(`Erro ao excluir o plano: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const cancelPlan = async (planId: number) => {
    setIsOperating(true);
    try {
      const planToUpdate = allPlans.find(p => p.id === planId);
      if (!planToUpdate) throw new Error("Plano não encontrado para cancelar.");
      const updatedPlanData = { ...planToUpdate, status: PlanStatus.CANCELADO };
      const updatedPlan = await api.updatePlan(updatedPlanData);
      setAllPlans(prevPlans => prevPlans.map(p => p.id === planId ? updatedPlan : p));
      addToast('Plano cancelado com sucesso.', 'info');
    } catch (error) {
       addToast(`Erro ao cancelar o plano: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  // Report Actions
  const saveReport = async (planId: number, reportName: string, summaryContent: string, dataUsed: ActionItem[]) => {
     setIsOperating(true);
    try {
      const newReport = await api.saveReport(planId, reportName, summaryContent, dataUsed);
      setSavedReports(prev => [...prev, newReport]);
      addToast('Relatório salvo com sucesso!', 'success');
      return newReport;
    } catch (error) {
      addToast(`Erro ao salvar o relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
      throw error; // Re-throw to be handled by the component
    } finally {
      setIsOperating(false);
    }
  };
  
  // Action Item actions (for the current plan)
  const addActionItem = async (item: Omit<ActionItem, 'id'>) => {
    if (!currentPlanId) return;
    setIsOperating(true);
    try {
      const newActionItem = await api.addActionItem(currentPlanId, item);
      setAllPlans(plans => plans.map(p => {
        if (p.id === currentPlanId) {
          return { ...p, actionItems: [...p.actionItems, newActionItem] };
        }
        return p;
      }));
      addToast('Ação adicionada com sucesso!', 'success');
    } catch (error) {
       addToast(`Erro ao adicionar a ação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const addActionItemsBatch = async (planId: number, items: Omit<ActionItem, 'id'>[]) => {
    if (!planId) return;
    setIsOperating(true);
    try {
      const updatedPlan = await api.addActionItemsBatch(planId, items);
      setAllPlans(plans => plans.map(p => p.id === planId ? updatedPlan : p));
      addToast(`${items.length} ações adicionadas ao plano!`, 'success');
    } catch (error) {
      addToast(`Erro ao adicionar ações em lote: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const updateActionItem = async (updatedItem: ActionItem) => {
    if (!currentPlanId) return;
    setIsOperating(true);
    try {
      await api.updateActionItem(currentPlanId, updatedItem);
      setAllPlans(plans => plans.map(p => {
        if (p.id === currentPlanId) {
          return { ...p, actionItems: p.actionItems.map(item => item.id === updatedItem.id ? updatedItem : item) };
        }
        return p;
      }));
      addToast('Ação atualizada com sucesso!', 'success');
    } catch (error) {
       addToast(`Erro ao atualizar a ação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const deleteActionItem = async (id: number) => {
    if (!currentPlanId) return;
    setIsOperating(true);
    try {
      await api.deleteActionItem(currentPlanId, id);
      setAllPlans(plans => plans.map(p => {
        if (p.id === currentPlanId) {
          return { ...p, actionItems: p.actionItems.filter(item => item.id !== id) };
        }
        return p;
      }));
       addToast('Ação excluída com sucesso.', 'info');
    } catch (error) {
      addToast(`Erro ao excluir a ação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    } finally {
      setIsOperating(false);
    }
  };
  
  const approveSuggestedItem = async (itemIndex: number) => {
    const itemToApprove = suggestedItems[itemIndex];
    if (itemToApprove) {
      // The addActionItem function handles toasts and state updates
      await addActionItem({
        ...itemToApprove,
        status: ActionStatus.AJUSTADAS_EM_EXECUCAO,
      });
      setSuggestedItems(suggestedItems.filter((_, index) => index !== itemIndex));
    }
  };

  const rejectSuggestedItem = (itemIndex: number) => {
    setSuggestedItems(suggestedItems.filter((_, index) => index !== itemIndex));
  };
  
  const updateSuggestedItem = (index: number, updatedData: SuggestedActionItem) => {
    setSuggestedItems(currentItems =>
      currentItems.map((item, i) => (i === index ? updatedData : item))
    );
  };


  return {
    loading,
    isOperating,
    // User
    currentUser,

    // Plan state and actions
    plans: allPlans,
    currentPlan,
    selectPlan,
    goHome,
    createPlan,
    deletePlan,
    cancelPlan,

    // Action item state and actions (for the current plan)
    actionItems,
    addActionItem,
    addActionItemsBatch,
    updateActionItem,
    deleteActionItem,
    suggestedItems,
    setSuggestedItems,
    approveSuggestedItem,
    rejectSuggestedItem,
    updateSuggestedItem,

    // Reports
    savedReports,
    saveReport,
  };
};