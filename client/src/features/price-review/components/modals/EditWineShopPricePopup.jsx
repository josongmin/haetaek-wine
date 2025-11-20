// src/components/reviewPrice/EditWineShopPricePopup.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import styles from './EditWineShopPricePopup.module.css';
import { UserContext } from '../../../../UserContext';
import {
  searchWines,
  getWineShopList,
  getUsedDiscountHistoryListOfShop,
  getCommentHistoryListOfShop,
  updateWinePrice,
  createWinePrice,
  setShowInWineDetailPage,
  setShowInSpecialPricePage,
} from '../../../../api/wineApi';
import { WineStatusMap } from '@myorg/shared/constants/wineStatusMap';
import { toLocalInputValue } from '../../../../shared/utils/dateTimeUtils';
import { toast } from 'react-hot-toast';
import WriterRolePopup from './SelectAdminWriterPopup';
import SelectAdminWriterPopup from './SelectAdminWriterPopup';
import AddWinePopup from './AddWinePopup';
import WineSearchPopup from './WineSearchPopup';
import { FaSearch } from 'react-icons/fa';
import { MIN_LEVEL_ADMIN } from '../../../../shared/utils/levelUtils';

// ---- last-submission snapshot helpers ----
const LAST_PRICE_KEY = 'lastPriceDraft_v1';

function buildSnapshotFromForm(form) {
  // 필요한 필드만 저장 (shop, wine은 검색칩이 다시 그려질 수 있도록 객체 그대로 보존)
  return {
    savedAt: new Date().toISOString(),
    form: {
      purchaseLink: form.purchaseLink || '',
      // 새로 뜰 땐 "지금"이 기본이 되도록 저장은 하되 로드 시 덮어쓸 거라 무방
      dateTime: form.dateTime || '',
      shop: form.shop || null,
      wine: form.wine || null,
      vintage: form.vintage || '',
      size: String(form.size ?? '750'),
      price: String(form.price ?? ''),
      priceUnit: form.priceUnit || '',
      discountMethod: form.discountMethod || '',
      finalPrice: String(form.finalPrice ?? ''),
      comment: form.comment || '',
      stockCount: form.stockCount ?? '',
      hideWriter: !!form.hideWriter,
      neededPoint: Number(form.neededPoint ?? 0),
      WPR_thumbnailURL: form.WPR_thumbnailURL || '',
    }
  };
}
function saveLastSubmission(form) {
  try {
    const snapshot = buildSnapshotFromForm(form);
    localStorage.setItem(LAST_PRICE_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn('saveLastSubmission failed', e);
  }
}
function loadLastSubmission() {
  try {
    const raw = localStorage.getItem(LAST_PRICE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.form || null;
  } catch (e) {
    console.warn('loadLastSubmission failed', e);
    return null;
  }
}
// END ---- last-submission snapshot helpers ----

export default function EditWineShopPricePopup({
  item = null,
  onUpdateItem,
  onClose,
  // 가격 새로 등록일 경우에 초기값을 설정하고 싶을 때. 수정일 때는 item 객체 내의 값들로 부터 정보를 뽑아서 보여줌.
  initialShop = null,
  initialWine = null,
  // 작성자를 지정하고 싶을 때. 어드민용. 
  writerForOverwrite = null,
  // 아이디얼와인이나 데일리샷 등의 다른 가격 정보를 크롤링해오고 그 데이터 기반으로 우리 서비스에 새로 등록하는 경우.
  addPriceFromOtherPrice = false,
}) {
  const { user } = useContext(UserContext);

  const [mouseDownOnBackground, setMouseDownOnBackground] = useState(false);

  // 작성자 변경 팝업 상태
  const [isWriterPopupOpen, setIsWriterPopupOpen] = useState(false);
  const [overwriteWriter, setOverwriteWriter] = useState(writerForOverwrite);

  // useEffect(() => {
  //   // item.writer가 바뀌면 우선권은 item.writer,
  //   // 없으면 로그인 사용자 정보로 보이도록
  //   setWriterForOverwrite(item?.writer ?? (user ? {
  //     index: user.index,
  //     id: user.id || '-',
  //     nickname: user.nickname || '-',
  //   } : null));
  // }, [item?.writer, user]);

  // --------------------------------------------------
  // 작성자 변경 핸들러
  const openWriterPopup = () => setIsWriterPopupOpen(true);
  const closeWriterPopup = () => setIsWriterPopupOpen(false);
  const confirmWriterChange = async (newWriter) => {
    const modified = { ...item, writer: newWriter, WPR_writerIndex: newWriter.index, 
      USR_index: newWriter.index, USR_id: newWriter.id, USR_nickname: newWriter.nickname 
    };
    onUpdateItem(modified);
    setOverwriteWriter(newWriter);   // ← 로컬 state 갱신
    toast.success('작성자 유형이 변경되었습니다.');
    closeWriterPopup();
  };

  // 통화 코드 목록
  const CURRENCIES = ["KRW", "EUR", "USD", "JPY", "HKD"];

  // 로딩/제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showWineDetailPage, setShowWineDetailPage] = useState(item?.WPR_showWineDetailPage === 1);
  const [showSpecialPricePage, setShowSpecialPricePage] = useState(item?.WPR_showSpecialPricePage === 1);

  // ── 할인 이력 (saleInfo) 자동완성 관련 state ──
  const [discountOptions, setDiscountOptions] = useState([]);
  const [discountInput, setDiscountInput] = useState("");
  const [showDiscountSuggestions, setShowDiscountSuggestions] = useState(false);
  const [discountFocused, setDiscountFocused] = useState(false);
  const [discountEdited, setDiscountEdited] = useState(false);

  // ── 코멘트 이력 관련 state ──
  const [showCommentHistory, setShowCommentHistory] = useState(false);
  const [commentHistoryLoading, setCommentHistoryLoading] = useState(false);
  const [commentHistoryItems, setCommentHistoryItems] = useState([]);
  const commentBtnRef = useRef(null);
  const commentListRef = useRef(null);
  const commentTextareaRef = useRef(null);

  // ── 와인샵 자동완성 관련 state ──
  const [shopInput, setShopInput] = useState("");
  const [shopSuggestions, setShopSuggestions] = useState([]);
  const [showShopSuggestions, setShowShopSuggestions] = useState(false);
  const [shopFocused, setShopFocused] = useState(false);
  const [shopEdited, setShopEdited] = useState(false);
  const shopDebounceRef = useRef(null);

  // ── 와인 자동완성 관련 state ──
  const [wineInput, setWineInput] = useState("");
  const [wineSuggestions, setWineSuggestions] = useState([]);
  const [showWineSuggestions, setShowWineSuggestions] = useState(false);
  const [wineFocused, setWineFocused] = useState(false);
  const [wineEdited, setWineEdited] = useState(false);
  const wineDebounceRef = useRef(null);

  // 와인 추가 팝업 상태 추가
  const [isAddWinePopupOpen, setIsAddWinePopupOpen] = useState(false);
  const [initialWineNameForAdd, setInitialWineNameForAdd] = useState("");
  
  // 와인 검색 팝업 상태 추가
  const [isWineSearchPopupOpen, setIsWineSearchPopupOpen] = useState(false);


  // ▶ EUR → KRW 환율 상태
  //const [eurKrwRate, setEurKrwRate] = useState(null);
  const [exchangeRateToKrw, setExchangeRateToKrw] = useState(null);
  // 로딩/에러 상태 추가
  const [isRateLoading, setIsRateLoading] = useState(false);
  const [rateError, setRateError] = useState(null);

  // ── 폼 전체 state ──
  const [form, setForm] = useState({
    purchaseLink: "",
    dateTime: toLocalInputValue(new Date().toISOString()),
    shop: null,
    wine: null,
    vintage: "",
    size: "750",
    price: "",
    priceUnit: "",
    discountMethod: "",
    finalPrice: "",
    comment: "",
    stockCount: "",
    hideWriter: false,
    neededPoint: 0,
    WPR_thumbnailURL: "",
  });

  // → "가격 → 최종 가격" 계산 로직
  const applyDiscountPercent = (discountText, priceValue) => {
    const priceFloat = parseFloat(priceValue ?? form.price) || 0;
    let finalPrice = priceFloat;
    if (!discountText) {
      setForm((prev) => ({ ...prev, finalPrice: priceFloat.toString() }));
      return;
    }
    const sanitized = discountText.replace(/\s/g, "").trim();

    // 1) "(환율x숫자)" 패턴
    const exchangeMatch = sanitized.match(/\(환율x([0-9]+(?:\.[0-9]+)?)(?:원)?\)/);
    if (exchangeMatch) {
      const rate = parseFloat(exchangeMatch[1]);
      if (rate > 0 && priceFloat > 0) {
        finalPrice = priceFloat * rate;
        setForm((prev) => ({ ...prev, finalPrice: Math.round(finalPrice).toString() }));
        return;
      }
    }

    // 2) 아이디얼와인 복합 계산: "환율숫자 x (가격+숫자) x 숫자 ->세금"
    if (
      sanitized.includes("환율") &&
      sanitized.includes("x(가격+") &&
      sanitized.includes(")x") &&
      sanitized.includes("->세금")
    ) {
      const regString = sanitized.split("->세금")[0];
      const parts = regString.split("x");
      let resultPrice = 1;
      for (let raw of parts) {
        let comp = raw.replace(/환율/g, "").trim();
        if (!comp) {
          resultPrice = 0;
          break;
        }
        if (comp.startsWith("(") && comp.endsWith(")")) {
          const inner = comp.slice(1, -1);
          if (!inner.includes("(") && !inner.includes(")")) {
            const tokens = inner.split("+");
            let sum = 0;
            for (let tok of tokens) {
              if (tok === "가격") {
                sum += priceFloat;
              } else {
                const num = parseFloat(tok);
                if (!isNaN(num)) sum += num;
              }
            }
            resultPrice *= sum;
          } else {
            resultPrice = 0;
          }
        } else {
          const num = parseFloat(comp);
          if (!isNaN(num)) {
            resultPrice *= num;
          } else {
            resultPrice = 0;
          }
        }
      }
      if (resultPrice > 0) {
        finalPrice = resultPrice;
        setForm((prev) => ({ ...prev, finalPrice: Math.round(finalPrice).toString() }));
        return;
      }
    }

    // 3) 일반 % 할인
    let percentNumberFromString = -1;
    if (sanitized.includes("%)")) {
      const parts = sanitized.split("%)");
      const before = parts[0];
      const digits = before.match(/([0-9]+(?:\.[0-9]+)?)$/);
      if (digits) percentNumberFromString = parseFloat(digits[1]);
    } else if (sanitized.includes("%")) {
      const parts = sanitized.split("%");
      const before = parts[0];
      const digits = before.match(/([0-9]+(?:\.[0-9]+)?)$/);
      if (digits) percentNumberFromString = parseFloat(digits[1]);
    }
    if (percentNumberFromString >= 1 && percentNumberFromString < 100 && priceFloat > 0) {
      const discountPercent = percentNumberFromString;
      finalPrice = priceFloat * ((100 - discountPercent) / 100);
      setForm((prev) => ({ ...prev, finalPrice: Math.round(finalPrice).toString() }));
      return;
    }

    // 그 외는 기본값
    setForm((prev) => ({ ...prev, finalPrice: priceFloat.toString() }));
  };

  useEffect(() => {
    // 통화 변경 시 이전 환율 결과/에러 리셋
    setExchangeRateToKrw(null);
    setRateError(null);
  }, [form.priceUnit]);

  useEffect(() => {
    // 날짜 변경 시도 동일 처리
    setExchangeRateToKrw(null);
    setRateError(null);
  }, [form.dateTime]);

  // ====================================================
  // ① "새 등록 모드" (item이 없거나 WPR_index 없으면) → 초기값 세팅
  // ====================================================
  useEffect(() => {
    const isNewMode = !item || item.WPR_index == null;
    if (!isNewMode) return;

    const now = toLocalInputValue(new Date().toISOString());

    if (initialShop && initialShop.WSH_index) {
      setForm((prev) => ({
        ...prev,
        dateTime: now,
        shop: {
          WSH_index: initialShop.WSH_index,
          WSH_headShopIndex: initialShop.WSH_headShopIndex,
          WSH_title: initialShop.WSH_title,
          WSH_branch: initialShop.WSH_branch,
          WSH_priceUnitCode: initialShop.WSH_priceUnitCode || "",
        },
        priceUnit: initialShop.WSH_priceUnitCode || "",
      }));
      const branchLbl = initialShop.WSH_branch ? ` ${initialShop.WSH_branch}` : "";
      setShopInput(`${initialShop.WSH_title}${branchLbl}`);
      setShopEdited(false);
    } else {
      setForm((prev) => ({ ...prev, dateTime: now, shop: null, priceUnit: "" }));
      setShopInput("");
      setShopEdited(false);
    }

    if (initialWine && initialWine.index) {
      setForm((prev) => ({
        ...prev,
        wine: {
          index: initialWine.index,
          titleKR: initialWine.titleKR,
          title: initialWine.title || "",
          thumbnailURLString: initialWine.thumbnailURLString || "",
        },
      }));
      setWineInput(initialWine.titleKR);
      setWineEdited(false);
    } else {
      setForm((prev) => ({ ...prev, wine: null }));
      setWineInput("");
      setWineEdited(false);
    }
  }, [item, initialWine, initialShop]);

  // ====================================================
  // ② "수정 모드" (item이 있을 때) → 서버 값으로 초기화
  // ====================================================
  useEffect(() => {
    if (
      !addPriceFromOtherPrice && // 다른 가격에서 온 게 아니면
      (!item || item.WPR_index == null) // item이 없거나 인덱스가 null이면
    ) {
      return;
    }

    const shopObj = item.WPR_shopIndex
      ? {
        WSH_index: item.WPR_shopIndex,
        WSH_headShopIndex: item.WPR_headShopIndex,
        WSH_title: item.WSH_title,
        WSH_branch: item.WSH_branch,
        WSH_priceUnitCode: item.WPR_priceUnitCode,
      }
      : null;

    const wineObj = item.WPR_wineIndex
      ? {
        index: item.WPR_wineIndex,
        titleKR: item.WIN_titleKR,
        title: item.WIN_title,
        thumbnailURLString: item.WIN_thumbnailURL,
      }
      : null;

    const dateTimeValue = toLocalInputValue(item.WPR_datetime);

    // 1) form state에 서버 값 세팅 (price, discountMethod 포함)
    setForm((prev) => ({
      ...prev,
      purchaseLink: item.WPR_purchaseLink || "",
      dateTime: dateTimeValue,
      shop: shopObj,
      wine: wineObj,
      vintage: item.WPR_vintage || "",
      size: item.WPR_bottleSize?.toString() || "750",
      price: item.WPR_price?.toString() || "",
      priceUnit: item.WPR_priceUnitCode || "",
      discountMethod: item.WPR_saleInfo || "",
      finalPrice: item.WPR_finalPrice?.toString() || "",
      comment: item.WPR_comment || "",
      stockCount: item.WPR_stockCount != null ? item.WPR_stockCount : "",
      hideWriter: !!item.WPR_hideWriter,
      neededPoint: item.WPR_point || 0,
      WPR_thumbnailURL: item.WPR_thumbnailURL || "",
    }));

    // 2) discountInput에도 서버의 saleInfo 채워 두기
    const initialSaleInfo = item.WPR_saleInfo || "";
    setDiscountInput(initialSaleInfo);

    if (shopObj) {
      const branchLabel = shopObj.WSH_branch ? ` ${shopObj.WSH_branch}` : "";
      setShopInput(`${shopObj.WSH_title}${branchLabel}`);
      setShopEdited(false);
    }
    if (wineObj) {
      setWineInput(`${wineObj.titleKR}`);
      setWineEdited(false);
    }

    // ── 팝업 열 때 스위치 초기값 동기화 ──
    setShowWineDetailPage(item.WPR_showWineDetailPage === 1);
    setShowSpecialPricePage(item.WPR_showSpecialPricePage === 1);
  }, [item]);

  // ── 폼 변경 헬퍼 ──
  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ── form.shop 변경 시 → 자동으로 "할인 이력" 조회해서 discountOptions 세팅 ──
  useEffect(() => {
    if (form.shop?.WSH_index) {
      fetchDiscountOptions(form.shop.WSH_index);
      const newUnit = form.shop.WSH_priceUnitCode || "";
      setForm((prev) => ({ ...prev, priceUnit: newUnit }));
    } else {
      setDiscountOptions([]);
      setForm((prev) => ({ ...prev, priceUnit: "" }));
    }
  }, [form.shop]);

  const fetchDiscountOptions = async (shopIndex) => {
    try {
      const resp = await getUsedDiscountHistoryListOfShop(shopIndex);
      const arr = resp.success ? resp.data : resp;
      const methods = arr
        .map((row) => row.WPR_saleInfo)
        .filter((s) => typeof s === "string" && s.trim() !== "");
      setDiscountOptions(methods);
    } catch (e) {
      console.error("할인수단 로드 실패:", e);
      setDiscountOptions([]);
    }
  };

  // ── 와인샵 자동완성 (focus / blur / debounce / 입력) ──
  const handleShopFocus = () => setShopFocused(true);
  const handleShopBlur = () => {
    setShopFocused(false);
    setTimeout(() => setShowShopSuggestions(false), 100);
  };
  useEffect(() => {
    const cleaned = shopInput.replace(/\s/g, "");
    if (cleaned.length < 2 || !shopFocused) {
      setShopSuggestions([]);
      setShowShopSuggestions(false);
      return;
    }
    if (!shopEdited) return;

    if (shopDebounceRef.current) clearTimeout(shopDebounceRef.current);
    shopDebounceRef.current = setTimeout(async () => {
      try {
        const results = await getWineShopList(cleaned);
        const arr = results.success ? results.data : results;
        setShopSuggestions(arr);
        setShowShopSuggestions(true);
      } catch (err) {
        console.error("와인샵 자동완성 오류:", err);
        setShopSuggestions([]);
        setShowShopSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(shopDebounceRef.current);
  }, [shopInput, shopEdited, shopFocused]);

  const handleShopSelect = (s) => {
    handleChange("shop", s);
    handleChange("priceUnit", s.WSH_priceUnitCode || "");
    const branchLabel = s.WSH_branch ? ` ${s.WSH_branch}` : "";
    setShopInput(`${s.WSH_title}${branchLabel}`);
    setShopEdited(false);
    setShowShopSuggestions(false);
  };

  // ── 와인 자동완성 (focus / blur / debounce / 입력) ──
  const handleWineFocus = () => setWineFocused(true);
  const handleWineBlur = () => {
    setWineFocused(false);
    setTimeout(() => setShowWineSuggestions(false), 100);
  };
  useEffect(() => {
    const cleaned = wineInput.replace(/\s/g, "");
    if (cleaned.length < 2 || !wineFocused) {
      setWineSuggestions([]);
      setShowWineSuggestions(false);
      return;
    }
    if (!wineEdited) return;

    if (wineDebounceRef.current) clearTimeout(wineDebounceRef.current);
    wineDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchWines(user, cleaned);
        setWineSuggestions(results);
        setShowWineSuggestions(true);
      } catch (err) {
        console.error("와인 자동완성 오류:", err);
        setWineSuggestions([]);
        setShowWineSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(wineDebounceRef.current);
  }, [wineInput, wineEdited, wineFocused, user]);

  const handleWineSelect = (w) => {
    handleChange("wine", w);
    setWineInput(`${w.titleKR}`);
    setWineEdited(false);
    setShowWineSuggestions(false);
  };

  // ── 할인수단 자동완성 (focus / blur) ──
  const handleDiscountFocus = () => setDiscountFocused(true);
  const handleDiscountBlur = () => {
    setDiscountFocused(false);
    setTimeout(() => setShowDiscountSuggestions(false), 100);
  };
  useEffect(() => {
    if (discountFocused && discountOptions.length > 0) {
      setShowDiscountSuggestions(true);
    } else {
      setShowDiscountSuggestions(false);
    }
  }, [discountEdited, discountFocused, discountOptions]);

  const handleDiscountSelect = (opt) => {
    handleChange("discountMethod", opt);
    setDiscountInput(opt);
    setDiscountEdited(false);
    setShowDiscountSuggestions(false);
    applyDiscountPercent(opt, form.price);
  };

  // ── "코멘트 이력 보기" 버튼 클릭 시 호출 (코멘트 전용) ──
  const handleShowCommentHistory = async () => {
    const shopIndexToUse =
      form.shop?.WSH_index != null
        ? form.shop.WSH_index
        : item?.WPR_shopIndex
          ? String(item.WPR_shopIndex)
          : null;

    if (!shopIndexToUse) {
      toast.error("와인샵을 먼저 선택해주세요.");
      return;
    }

    setShowCommentHistory((prev) => !prev);
    if (!showCommentHistory) {
      setCommentHistoryLoading(true);
      try {
        const resp = await getCommentHistoryListOfShop(shopIndexToUse);
        const arr = resp.success ? resp.data : resp;
        setCommentHistoryItems(arr);
      } catch (e) {
        console.error("코멘트 히스토리 로드 실패:", e);
        setCommentHistoryItems([]);
      } finally {
        setCommentHistoryLoading(false);
      }
    }
  };

  // ── 코멘트 히스토리 항목 클릭 시 form.comment에 삽입 ──
  const handleSelectCommentHistoryItem = (h) => {
    const text = h.WPR_comment || "";
    handleChange("comment", text);
    setShowCommentHistory(false);
    if (commentTextareaRef.current) {
      commentTextareaRef.current.focus();
    }
  };

  // ── 코멘트 히스토리 리스트 외부 클릭 시 닫기 ──
  useEffect(() => {
    if (!showCommentHistory) return;
    const onDownCapture = (e) => {
      const listEl = commentListRef.current;
      const btnEl = commentBtnRef.current;
      if (!listEl) return;
      const clickedInsideList = listEl.contains(e.target);
      const clickedOnButton = btnEl && btnEl.contains(e.target);
      if (!clickedInsideList && !clickedOnButton) {
        setShowCommentHistory(false);
      }
    };
    // 캡처 단계로 등록해야 컨테이너의 stopPropagation() 영향 안 받음
    document.addEventListener('mousedown', onDownCapture, true);
    document.addEventListener('touchstart', onDownCapture, true);
    return () => {
      document.removeEventListener('mousedown', onDownCapture, true);
      document.removeEventListener('touchstart', onDownCapture, true);
    };
  }, [showCommentHistory]);

  // ── 폼 제출 핸들러 ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 필수검증
    if (!form.shop) {
      toast.error("와인샵을 선택해주세요.");
      return;
    }
    if (!form.wine) {
      toast.error("와인을 선택해주세요.");
      return;
    }
    if ((form.vintage || "").replace(/\s/g, "").length < 1) {
      toast.error("빈티지를 한 글자 이상 입력해주세요.");
      return;
    }
    if (!form.size || form.size.toString().trim().length < 1) {
      toast.error("용량을 입력해주세요.");
      return;
    }
    if (!form.price || form.price.toString().trim().length < 1) {
      toast.error("판매 가격을 입력해주세요.");
      return;
    }
    // 날짜 검증: 3년 이상 지난 날짜는 막기
    const selectedDate = new Date(form.dateTime);
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    if (selectedDate < threeYearsAgo) {
      toast.error("3년 이상 지난 구매 날짜는 등록할 수 없습니다.");
      return;
    }

    setIsSubmitting(true);

    // payloadObj 만들기
    const requesterIndex = String(user.index ?? "");

    const writerIndex =
    overwriteWriter?.index != null
        ? String(overwriteWriter.index)    // ← currentWriter 우선 사용
        : (item?.WPR_writerIndex != null // 보통은 작성자와 요청자가 같음. 어드민이 아니라면 타인의 수정 자체가 막혀서 다른 값으로 진입될 일은 없음.
            ? String(item.WPR_writerIndex)
            : requesterIndex);
    const wineIndex = String(form.wine.index);
    const shopIndex = String(form.shop.WSH_index);
    const headShopIndex =
      form.shop.WSH_headShopIndex != null ? String(form.shop.WSH_headShopIndex) : "";
    const vintage = form.vintage;
    const bottleSize = String(form.size);
    const datetime = form.dateTime.replace("T", " ") + ":00";
    const price = parseFloat(form.price);
    const finalPrice = parseFloat(form.finalPrice);
    const saleInfo = form.discountMethod;
    const comment = form.comment;
    const purchaseLink = form.purchaseLink;
    // const showSpecialPricePage = item?.WPR_showSpecialPricePage ?? 0;
    // const showWineDetailPage = item?.WPR_showWineDetailPage ?? 1;
    const showInSpecialPricePage = showSpecialPricePage ? 1 : 0;
    const showInWineDetailPage = showWineDetailPage ? 1 : 0;
    const point = form.neededPoint;
    const originalPriceUnitCode = form.priceUnit !== "" ? form.priceUnit : null;
    const stockCount =
      form.stockCount !== "" && form.stockCount != null ? Number(form.stockCount) : null;
    const hideWriter = form.hideWriter ? 1 : 0;
    const countryCode = "";
    const accessToken = user.accessToken ?? "";
    const thumbnailURL = form.WPR_thumbnailURL;

    const payloadObj = {
      requesterIndex,
      writerIndex,
      wineIndex,
      shopIndex,
      headShopIndex,
      vintage,
      bottleSize,
      datetime,
      price,
      finalPrice,
      saleInfo,
      comment,
      purchaseLink,
      showInSpecialPricePage,
      showInWineDetailPage,
      point,
      originalPriceUnitCode,
      stockCount,
      thumbnailURL,
      hideWriter,
      countryCode,
      accessToken,
      ...(item && item.WPR_index ? { index: String(item.WPR_index) } : {}),
    };

    try {
      const apiResponse =
        item && item.WPR_index
          ? await updateWinePrice(payloadObj)
          : await createWinePrice(payloadObj);

      if (!apiResponse || (apiResponse.code && apiResponse.code !== "0")) {
        const msg = (apiResponse && apiResponse.errorMessage) || "알 수 없는 서버 오류";
        throw new Error(msg);
      }

      const modifiedItem = {
        ...item,
        WPR_purchaseLink: purchaseLink,
        WPR_datetime: datetime,
        WPR_shopIndex: shopIndex,
        WPR_headShopIndex: headShopIndex,
        WPR_wineIndex: wineIndex,
        WPR_vintage: vintage,
        WPR_bottleSize: bottleSize,
        WPR_price: price,
        WPR_priceUnitCode: originalPriceUnitCode,
        WPR_saleInfo: saleInfo,
        WPR_finalPrice: finalPrice,
        WPR_comment: comment,
        WPR_stockCount: stockCount,
        WPR_hideWriter: hideWriter,
        WPR_point: point,
        WSH_index: form.shop.WSH_index,
        WSH_title: form.shop.WSH_title,
        WSH_branch: form.shop.WSH_branch,
        WSH_priceUnitCode: form.shop.WSH_priceUnitCode,
        WIN_titleKR: form.wine.titleKR,
        WIN_title: form.wine.title,
        WIN_thumbnailURL: form.wine.thumbnailURLString,
        WPR_thumbnailURL: form.WPR_thumbnailURL,
        writer: overwriteWriter ?? item?.writer,
        WPR_writerIndex: overwriteWriter?.index ?? item?.WPR_writerIndex,
        USR_index: overwriteWriter?.index ?? item?.USR_index,
        USR_id: overwriteWriter?.id ?? item?.USR_id,
        USR_nickname: overwriteWriter?.nickname ?? item?.USR_nickname,
        USR_level: overwriteWriter?.level ?? item?.USR_level,
      };

      localStorage.setItem('REVIEW_PRICE_LAST_SUBMITTED', JSON.stringify(modifiedItem));

      onUpdateItem(modifiedItem);
      onClose();
      //onClose(modifiedItem);
    } catch (err) {
      console.error(err);
      toast.error(`저장 중 에러가 발생했습니다: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 메인 노출 스위치 핸들러 ---
  const toggleShowDetail = async (e) => {
    const next = e.target.checked;
    setShowWineDetailPage(next);
    try {
      if (!item || !item.WPR_index) {
        toast.success('등록 완료 후 설정할 수 있어요.');
        return;
      }
      await setShowInWineDetailPage(next, item.WPR_index);
      // 부모에만 변경된 item 알려주기
      const modifiedItem = {
        ...item,
        WPR_showWineDetailPage: next ? 1 : 0,
      };
      onUpdateItem(modifiedItem);
      toast.success('변경 완료');
    } catch (err) {
      console.error(err);
      toast.error(`변경 실패: ${err.message}`);
      // 실패 시 롤백
      setShowWineDetailPage(!next);
    }
  };

  // --- 특가 스위치 핸들러 ---
  const toggleShowSpecial = async (e) => {
    const next = e.target.checked;
    setShowSpecialPricePage(next);
    try {
      if (!item || !item.WPR_index) {
        toast.success('등록 완료 후 설정할 수 있어요.');
        return;
      }
      await setShowInSpecialPricePage(next, item.WPR_index);
      // 부모에만 변경된 item 알려주기
      const modifiedItem = {
        ...item,
        WPR_showSpecialPricePage: next ? 1 : 0,
      };
      onUpdateItem(modifiedItem);
      toast.success('변경 완료');
    } catch (err) {
      console.error(err);
      toast.error(`변경 실패: ${err.message}`);
      setShowSpecialPricePage(!next);
    }
  };


  const handleUpdateToday = () => {
    const prevDateIso = form.dateTime;                     // 갱신 전 날짜 ISO
    const prevDate = new Date(prevDateIso);
    const now = new Date();
    const newDateIso = toLocalInputValue(now.toISOString()); // YYYY-MM-DDThh:mm
    // 포맷 함수: MM/dd 혹은 yy/MM/dd
    const fmt = (d, includeYear) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return includeYear ? `${String(y).slice(2)}/${m}/${dd}` : `${m}/${dd}`;
    };

    // 이전/새 날짜 포맷 결정 (년도 포함 여부)
    const needYear = prevDate.getFullYear() !== now.getFullYear();
    const prevFmt = fmt(prevDate, needYear);
    const newFmt = fmt(now, needYear);

    // 기존 코멘트
    let c = form.comment?.trim() || '';
    const hasAnyMd = /\d{2}\/\d{2}/.test(c);

    let suffix;
    if (!c) {
      // ① 코멘트가 없었으면 "MM/dd -> MM/dd 가격 동일"
      suffix = `${prevFmt} -> ${newFmt} 가격 동일`;
    } else if (hasAnyMd) {
      // ② 이미 MM/dd가 포함되어 있으면"줄바꿈 + MM/dd 가격 동일"
      suffix = `\n${newFmt} 가격 동일`;
    } else {
      // ③ 코멘트는 있으나 MM/dd 없으면 "줄바꿈 + MM/dd -> MM/dd 가격 동일"
      suffix = `\n${prevFmt} -> ${newFmt} 가격 동일`;
    }

    // form 업데이트
    setForm(prev => ({
      ...prev,
      dateTime: newDateIso,
      comment: c + suffix
    }));
  };

  const fetchExchangeRate = async (code, rateDate) => {
    const res = await fetch(
      `https://api.frankfurter.app/${rateDate}?from=${encodeURIComponent(code)}&to=KRW`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rate = data?.rates?.KRW;
    if (typeof rate !== 'number') throw new Error('KRW rate not found');
    return rate;
  };

  // ▶ 환율 확인 핸들러
  const handleCheckExchangeRate = async (code) => {
    if (!code) {
      toast.error('통화를 먼저 선택해주세요.');
      return;
    }
    const rateDate = form.dateTime.split('T')[0];

    setIsRateLoading(true);
    setRateError(null);

    try {
      const rate = await fetchExchangeRate(code, rateDate);
      setExchangeRateToKrw(rate);
    } catch (e) {
      console.error('환율 조회 실패', e);
      setRateError('환율을 불러오지 못했습니다.');
      // alert는 선택사항: UX상 굳이 띄우지 않으려면 주석 처리 가능
      // alert('환율을 불러오지 못했습니다.');
    } finally {
      setIsRateLoading(false);
    }
  };

  // 현재 선택된 샵 index 해석
  const getCurrentShopIndex = () =>
    form.shop?.WSH_index ?? (item?.WPR_shopIndex ? String(item.WPR_shopIndex) : null);

  // 샵별 할인수단 기본 문자열(템플릿) 결정
  const buildDiscountTemplate = (shopIndex, rate) => {
    // 숫자에 콤마 넣지 말 것! (파서가 콤마를 허용하지 않음) -> 샵별로 소수점 필요가 다름.
    //const r = Math.round(rate) - 1; // 정수로 고정(필요시 소수점도 가능)
    let r;
    switch (String(shopIndex)) {
      case '1036': // 타운 와인
        r = (rate).toFixed(1);  // 소수점 한자리
        return `(환율 x${r}원)`;
      case '973': // 다이렉트 와인
        r = Math.round(rate) - 1; // 정수로 고정(필요시 소수점도 가능)
        return `배송비, 세금 포함 (환율 x${r}원)`;
      case '1473': // 엑스 와인
        r = Math.round(rate) - 1; // 정수로 고정(필요시 소수점도 가능)
        return `배송비, 세금 포함 (환율 x${r}원)`;
      case '1793': // 비비 와인
        r = (rate).toFixed(2); 
        return `배송비, 세금 포함 (환율 x${r}원)`;
      case '926': // 아이디얼 와인
        r = Math.round(rate) - 1; // 정수로 고정(필요시 소수점도 가능)
        return `환율 ${r} x (가격+9.33) x 1.46 -> 세금 46%, 12병 기준 병당 배송비 9.33`;
      // case 'xxxx': return '...';  // 다른 샵 규칙들 추가 예정
      default:
        r = Math.round(rate) - 1; // 정수로 고정(필요시 소수점도 가능)
        return `(환율x${r}원)`; // 기본 템플릿
    }
  };

  // 환율 적용 버튼: 조회 + 필드 자동입력 + 최종가 계산
  const handleApplyExchangeRate = async () => {
    const code = form.priceUnit;
    if (!code) {
      toast.error('통화를 먼저 선택해주세요.');
      return;
    }
    const rateDate = form.dateTime.split('T')[0];
    setIsRateLoading(true);
    setRateError(null);
    try {
      const rate = await fetchExchangeRate(code, rateDate);
      setExchangeRateToKrw(rate);
      const shopIdx = getCurrentShopIndex();
      const template = buildDiscountTemplate(shopIdx, rate);
      setDiscountInput(template);
      handleChange('discountMethod', template);
      // 가격/할인수단을 바탕으로 최종가 재계산
      applyDiscountPercent(template, form.price);
    } catch (e) {
      console.error('환율 적용 실패', e);
      setRateError('환율을 불러오지 못했습니다.');
    } finally {
      setIsRateLoading(false);
    }
  };


  return (
    <>
      <div
        className={styles.popupOverlay}
        onMouseDown={(e) => {
          // 배경 클릭 시작
          setMouseDownOnBackground(true);
        }}
        onMouseUp={(e) => {
          // 배경에서 mouseDown 시작했고 mouseUp도 배경에서 발생 → 닫기
          if (mouseDownOnBackground) {
            onClose();
          }
        }}
      >
        <div
          className={styles.popupContainer}
          onMouseDown={(e) => {
            e.stopPropagation();
            setMouseDownOnBackground(false); // 배경 클릭 아님
          }}
          onMouseUp={(e) => e.stopPropagation()}
        >
          {/* 스위치 그룹 */}
          <div
            className="switch-group-inline"
            style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}
          >
            <div className="switch-row">
              <span className="switch-label">메인노출</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showWineDetailPage}
                  onChange={toggleShowDetail}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="switch-row">
              <span className="switch-label">특가</span>
              <label className="switch red-switch">
                <input
                  type="checkbox"
                  checked={showSpecialPricePage}
                  onChange={toggleShowSpecial}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* 작성자 정보 */}
            <div className={styles.writerInfo}>
              <span>
                {item?.WPR_index != null ? `index: ${item.WPR_index} | ` : null} {item?.WPR_index != null ? '작성자' : '작성 예정'}: {
                  overwriteWriter?.nickname && overwriteWriter?.id
                    ? `${overwriteWriter.nickname} (${overwriteWriter.id})`
                    : `${item.USR_nickname} (${item.USR_id})`
                }
              </span>
              {user.level >= MIN_LEVEL_ADMIN && (
                <button type="button" className={styles.changeWriterBtn} onClick={openWriterPopup}>
                  변경
                </button>
              )}
            </div>

          <header className={styles.popupHeader}>
            <h2>{item?.WPR_index != null ? "가격 수정" : "새 가격 등록"}</h2>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </header>

          <form className={styles.popupForm} onSubmit={handleSubmit}>
            {/* 첨부파일(사진) 표시 */}
            {item?.attachedPhotos && item.attachedPhotos.length > 0 && (
              <div className={styles.formRow}>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
                  {item.attachedPhotos.map((photo, idx) => (
                    <div key={idx} style={{ flex: '0 0 auto', width: 100, height: 100 }}>
                      <a href={photo.WPH_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%', borderRadius: 4, overflow: 'hidden', border: '1px solid #eee' }}>
                        <img src={photo.WPH_url} alt={`photo-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 썸네일 입력/미리보기 */}
            <div className={styles.formRow} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 60, height: 100, borderRadius: 4, border: '1px solid #ccc', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                <img
                  src={form.WPR_thumbnailURL || '/placeholder-image.png'}
                  alt="thumbnail"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontWeight: 'bold', marginBottom: 4 }}>썸네일 URL</label>
                <input
                  type="text"
                  value={form.WPR_thumbnailURL || ''}
                  onChange={e => handleChange('WPR_thumbnailURL', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* 구매 링크 */}
            <div className={styles.formRow}>
              <label>구매 링크</label>
              <input
                type="url"
                value={form.purchaseLink}
                onChange={e => handleChange("purchaseLink", e.target.value)}
              />
            </div>

            {/* 구매 날짜 및 시간 */}
            <div className={styles.formRow}>
              <label>구매 날짜 및 시간</label>
              <input
                type="datetime-local"
                value={form.dateTime}
                onChange={e => handleChange("dateTime", e.target.value)}
              />
            </div>

            {/* 와인샵 자동완성 */}
            <div className={styles.formRow} style={{ position: "relative" }}>
              <label>와인샵</label>
              {form.shop && (
                <div className={`${styles.chip} ${styles.shopChip}`}>
                  <span className={styles.shopName}>{form.shop.WSH_title}</span>
                  {form.shop.WSH_branch && (
                    <span className={styles.shopBranch}>{form.shop.WSH_branch}</span>
                  )}
                  <span
                    className={styles.chipRemove}
                    onClick={() => {
                      handleChange("shop", null);
                      handleChange("priceUnit", "");
                    }}
                  >
                    ✕
                  </span>
                </div>
              )}
              <input
                type="text"
                value={shopInput}
                onChange={e => { setShopInput(e.target.value); setShopEdited(true); }}
                onFocus={handleShopFocus}
                onBlur={handleShopBlur}
                placeholder="와인샵 검색하기"
              />
              {showShopSuggestions && shopSuggestions.length > 0 && (
                <ul className={styles.suggestionList}>
                  {shopSuggestions.map(s => (
                    <li
                      key={s.WSH_index}
                      className={`${styles.suggestionItem} ${styles.shopSuggestionItem}`}
                      onMouseDown={() => handleShopSelect(s)}
                    >
                      <span className={styles.shopName}>{s.WSH_title}</span>
                      {s.WSH_branch && <span className={styles.shopBranch}>{s.WSH_branch}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 와인 자동완성 */}
            <div className={styles.formRow} style={{ position: "relative" }}>
              <label>와인명</label>
              {form.wine && (
                <div className={`${styles.chip} ${styles.wineChip}`}>
                  <img
                    src={form.wine.thumbnailURLString}
                    alt="wine chip thumb"
                    className={styles.wineChipThumb}
                  />
                  <div className={styles.wineChipText}>
                    <span className={styles.wineChipKr}>{form.wine.titleKR}</span>
                    <span className={styles.wineChipEn}>{form.wine.title}</span>
                  </div>
                  <span
                    className={styles.chipRemove}
                    onClick={() => handleChange("wine", null)}
                  >
                    ✕
                  </span>
                </div>
              )}
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  value={wineInput}
                  onChange={e => { setWineInput(e.target.value); setWineEdited(true); }}
                  onFocus={handleWineFocus}
                  onBlur={handleWineBlur}
                  placeholder="와인 검색하기"
                  style={{ paddingRight: '35px' }}
                />
                <FaSearch
                  onClick={() => setIsWineSearchPopupOpen(true)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: '#666',
                    fontSize: '14px'
                  }}
                />
              </div>
              {showWineSuggestions //&& wineSuggestions.length > 0 
                && (
                  <ul className={styles.suggestionList}>
                    {wineSuggestions.map(w => (
                      <li
                        key={w.index}
                        className={`${styles.suggestionItem} ${styles.wineSuggestionItem}`}
                        onMouseDown={() => handleWineSelect(w)}
                      >
                        <div className={styles.wineSuggestionThumbnailWrapper}>
                          {w.thumbnailURLString
                            ? <img src={w.thumbnailURLString} alt="wine-thumb" className={styles.wineSuggestionThumb} />
                            : <div className={styles.wineSuggestionThumbPlaceholder}>
                              {WineStatusMap[w.status] || "알 수 없음"}
                            </div>
                          }
                        </div>
                        <div className={styles.wineSuggestionText}>
                          <span className={styles.wineNameKr}>{w.titleKR}</span>
                          <span className={styles.wineNameEn}>{w.title}</span>
                        </div>
                      </li>
                    ))}
                    <li
                      className={`${styles.suggestionItem} ${styles.addWineSuggestionItem}`}
                      onMouseDown={() => {
                        setInitialWineNameForAdd(wineInput);
                        setIsAddWinePopupOpen(true);
                        setShowWineSuggestions(false);
                      }}
                    >
                      "{wineInput}" 와인 추가하기
                    </li>
                  </ul>
                )}
            </div>

            {/* 빈티지 / 용량 */}
            <div className={styles.vintageSizeRow}>
              <div className={styles.formRow}>
                <label>빈티지</label>
                <input
                  type="text"
                  value={form.vintage}
                  onChange={e => handleChange("vintage", e.target.value)}
                />
              </div>
              <div className={styles.formRow}>
                <label>용량 (ml)</label>
                <input
                  type="number"
                  value={form.size}
                  onChange={e => handleChange("size", e.target.value)}
                  onWheel={e => e.currentTarget.blur()}
                />
              </div>
            </div>

            {/* 판매 가격 + 통화 코드 */}
            <div className={styles.formRowInline}>
              <div className={styles.formRow} style={{ flex: 2 }}>
                <label>판매 가격</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => {
                    handleChange("price", e.target.value);
                    applyDiscountPercent(discountInput, e.target.value);
                  }}
                  onWheel={e => e.currentTarget.blur()}
                />
              </div>
              <div className={`${styles.formRow} ${styles.currencyRow}`} style={{ flex: 1, maxWidth: 80 }}>
                <label>통화</label>
                <select
                  value={form.priceUnit}
                  onChange={e => handleChange("priceUnit", e.target.value)}
                >
                  <option value="">—</option>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* 할인 수단 */}
            <div className={styles.formRow}>
              <div className={styles.discountHeader}>
                <label>할인 수단</label>
                <div className={styles.rateWrapper}>
                  {form.priceUnit && form.priceUnit !== 'KRW' && (
                    <>
                      {/* ← 새로 추가: 환율 적용 */}
                      <button
                        type="button"
                        className={styles.rateCheckBtn}
                        onClick={handleApplyExchangeRate}
                        disabled={isRateLoading || !form.priceUnit}
                        aria-busy={isRateLoading}
                        style={{ marginRight: 8 }}
                      >
                        {isRateLoading ? '적용 중…' : '환율 적용'}
                      </button>
                      {/* 기존: 환율 확인 */}
                      <button
                        type="button"
                        className={styles.rateCheckBtn}
                        onClick={() => handleCheckExchangeRate(form.priceUnit)}
                        disabled={isRateLoading || !form.priceUnit}
                        aria-busy={isRateLoading}
                      >
                        {isRateLoading ? '불러오는 중…' : '환율 확인'}
                      </button>
                    </>
                  )}
                  {exchangeRateToKrw != null && (
                    <span className={styles.rateResult}>
                      {exchangeRateToKrw.toLocaleString()}원
                    </span>
                  )}
                  {rateError && (
                    <span className={styles.rateError}>
                      {rateError}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.discountField}>
                <input
                  type="text"
                  value={discountInput}
                  onChange={e => {
                    setDiscountInput(e.target.value);
                    handleChange("discountMethod", e.target.value);
                    applyDiscountPercent(e.target.value, form.price);
                  }}
                  onFocus={() => setDiscountFocused(true)}
                  onBlur={() => {
                    setDiscountFocused(false);
                    setTimeout(() => setShowDiscountSuggestions(false), 100);
                  }}
                  placeholder="목록에서 선택하거나 직접 입력"
                />
                {(discountFocused || discountEdited) && showDiscountSuggestions && discountOptions.length > 0 && (
                  <ul className={styles.suggestionList}>
                    {discountOptions.map((opt, i) => (
                      <li
                        key={`${opt}${i}`}
                        className={styles.discountSuggestionItem}
                        onMouseDown={() => {
                          handleChange("discountMethod", opt);
                          setDiscountInput(opt);
                          setDiscountEdited(false);
                          applyDiscountPercent(opt, form.price);
                        }}
                      >
                        {opt}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* 최종 가격 */}
            <div className={styles.formRow}>
              <label>최종 가격</label>
              <input
                type="number"
                value={form.finalPrice}
                onChange={e => handleChange("finalPrice", e.target.value)}
                onWheel={e => e.currentTarget.blur()}
              />
            </div>

            {/* 코멘트 + 이력 */}
            <div className={styles.formRow} style={{ position: "relative" }}>
              <label>코멘트</label>
              <textarea
                rows={3}
                value={form.comment}
                onChange={e => handleChange("comment", e.target.value)}
                ref={commentTextareaRef}
              />
              <div style={{ textAlign: "right" }}>
                <button
                  type="button"
                  className={styles.historyBtn}
                  onClick={handleShowCommentHistory}
                  ref={commentBtnRef}
                >
                  이력 보기
                </button>
              </div>
              {showCommentHistory && (
                <div className={styles.historyList} ref={commentListRef}>
                  {commentHistoryLoading && <div className={styles.historyLoading}>로딩 중…</div>}
                  {!commentHistoryLoading && commentHistoryItems.length === 0 && (
                    <div className={styles.historyEmpty}>코멘트 이력이 없습니다.</div>
                  )}
                  {!commentHistoryLoading && commentHistoryItems.map((h, i) => (
                    <div
                      key={i}
                      className={styles.historyItem}
                      onClick={() => handleSelectCommentHistoryItem(h)}
                    >
                      <div className={styles.historyItemDate}>
                        {h.WPR_datetime?.split("T")[0].split("-").map((v, j) => j === 0 ? v.slice(-2) : v).join(".")}
                      </div>
                      <div className={styles.historyItemText}>{h.WPR_comment}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 재고 / 작성자 숨김 / 열람 포인트 */}
            <div className={styles.formRowInline}>
              <div className={styles.formRow}>
                <label>재고</label>
                <select
                  value={form.stockCount}
                  onChange={e => handleChange("stockCount", e.target.value)}
                >
                  <option value="">모름</option>
                  {Array.from({ length: 101 }, (_, i) => <option key={i} value={i}>{i}</option>)}
                  {[200, 300, 400, 500, 600, 700, 800, 900, 1000].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formRow}>
                <label>작성자 숨김</label>
                <input
                  type="checkbox"
                  checked={form.hideWriter}
                  onChange={() => handleChange("hideWriter", !form.hideWriter)}
                  style={{ marginTop: 6 }}
                />
              </div>
              <div className={styles.formRow}>
                <label>열람 포인트</label>
                <select
                  value={form.neededPoint}
                  onChange={e => handleChange("neededPoint", Number(e.target.value))}
                >
                  {Array.from({ length: 21 }, (_, i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <footer className={styles.popupFooter}>
              {item?.WPR_index != null ? (
                <>
                  <button
                    type="button"
                    className={styles.updateTodayBtn}
                    onClick={handleUpdateToday}
                  >
                    오늘로 갱신
                  </button>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "로딩중…" : "수정 완료"}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1 }} />
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "로딩중…" : "등록 완료"}
                  </button>
                </>
              )}
            </footer>
          </form>
        </div>
      </div>

      {/* 작성자 변경 전용 팝업 (메인 팝업과 독립) */}
      <SelectAdminWriterPopup
        isOpen={isWriterPopupOpen}
        initialWriter={item?.writer ?? null}
        priceIndex={item?.WPR_index}
        wineIndex={item?.WPR_wineIndex}
        onConfirm={confirmWriterChange}
        onCancel={closeWriterPopup}
      />


      {/* WineSearchPopup 모달 렌더 */}
      {isWineSearchPopupOpen && (
        <WineSearchPopup
          isOpen={isWineSearchPopupOpen}
          onClose={() => setIsWineSearchPopupOpen(false)}
          onSelectWine={(wine) => {
            // Gemini 검색 결과를 폼에 반영
            const wineObj = {
              index: null, // 새 와인이므로 index 없음
              title: wine.en_name || '',
              titleKR: wine.kr_name || '',
              thumbnailURLString: wine.thumbnail_url || '',
            };
            handleChange("wine", wineObj);
            setWineInput(wine.kr_name || wine.en_name || '');
            
            // 빈티지가 있으면 자동 입력
            if (wine.vintage) {
              handleChange("vintage", String(wine.vintage));
            }
            
            // 썸네일 URL이 있으면 자동 입력
            if (wine.thumbnail_url) {
              handleChange("WPR_thumbnailURL", wine.thumbnail_url);
            }
            
            setIsWineSearchPopupOpen(false);
            toast.success('와인 정보가 입력되었습니다.');
          }}
        />
      )}

      {/* AddWinePopup 모달 렌더 */}
      {isAddWinePopupOpen && (
        <AddWinePopup
          initialWineName={initialWineNameForAdd}
          onClose={(newWinePayload) => {
            setIsAddWinePopupOpen(false);
            if (newWinePayload && newWinePayload.WPR_wineIndex) {
              const w = {
                index: newWinePayload.WPR_wineIndex,
                title: newWinePayload.WIN_title,
                titleKR: newWinePayload.WIN_titleKR,
                thumbnailURLString: newWinePayload.WIN_thumbnailURL,
              };
              handleChange("wine", w);
              setWineInput(w.titleKR);
              setWineEdited(false);
            }
          }}
        />
      )}
    </>
  );
}

const STOCK_OPTIONS = [
  { value: "", label: "모름" },
  ...Array.from({ length: 101 }, (_, i) => ({ value: i, label: i })),
  ...[200, 300, 400, 500, 600, 700, 800, 900, 1000].map(v => ({ value: v, label: v })),
];