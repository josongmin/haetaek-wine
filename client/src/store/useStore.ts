import { create } from 'zustand';

interface StoreState {
  isAiModalOpen: boolean;
  openAiModal: () => void;
  closeAiModal: () => void;
  filters: any;
  setFilters: (filters: any) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const useStore = create<StoreState>((set) => ({
  // AI 문장 인식 모달 상태
  isAiModalOpen: false,
  openAiModal: () => set({ isAiModalOpen: true }),
  closeAiModal: () => set({ isAiModalOpen: false }),

  // 필터 상태 (필요시 사용)
  filters: null,
  setFilters: (filters) => set({ filters }),

  // 로딩 상태 (필요시 사용)
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));

export default useStore;

