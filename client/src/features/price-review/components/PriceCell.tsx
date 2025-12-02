import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import './PriceCell.css';
import { formatPrice } from '../../../shared/utils/formatPrice';
import { FaImage } from 'react-icons/fa';
import {
  insertPointForWritePrice, updatePointForWritePrice, insertReportForPrice, updateReportForPrice,
  setShowInSpecialPricePage, setShowInWineDetailPage, setStockCountOfPrice, setHasReceiptOfPrice,
  setNeededPointForShowOfPrice, updateWinePriceStatus, deleteReportForPrice, updateUserLevel,
  updatePhotoType, deletePointHistoryWithSyncUserPoint, deletePriceWithRelatedData,
  pushPriceReview, sendPushToTopic, getUserByIndex, pushUserLevelChanged, updateWineStatus,
  updateWineStatusToIncompleteIfNotPass
} from '../../../api/wineApi';
import { levelTitle, MIN_LEVEL_ADMIN } from '../../../shared/utils/levelUtils'; // levelTitle(level: number): string
import { toLocalDisplay } from '../../../shared/utils/dateTimeUtils';
import {
  winePriceStatusOptions,
  PRICE_STATUS_WAITING,
  PRICE_STATUS_PASS_BEFORE,
  PRICE_STATUS_PASS,
  PRICE_STATUS_REJECT,
  PRICE_STATUS_DELETED
} from '@myorg/shared/constants/winePriceStatusMap';
import { useDragClickGuard } from '../../../shared/utils/useDragClickGuard';
import { buildHotDealMessage } from '../../../shared/utils/pushMessage';
import {
  //WINE_STATUS_PASS,
  //WINE_STATUS_WAITING,
  WINE_STATUS_INCOMPLETE,
  //WINE_STATUS_DISABLED,
} from '@myorg/shared/constants/wineStatusMap';

const statusOptions = winePriceStatusOptions

const FIRST_LEVEL_VALUES = [40, 60, 200, 400];
const SECOND_LEVEL_VALUES = [0, 3, 4, 5, 6, 7, 8, 9];


export default function PriceCell({ item,
  onClickWineSection, onClickSeeHistory, onClickPriceEdit, onClickUser, onClickShop, onClickClone,
  onItemChange }) {
  const wineGuard = useDragClickGuard(5);
  const middleGuard = useDragClickGuard(5);
  const shopGuard = useDragClickGuard(5);

  // ── 1) “item” prop 기반 초기 로컬 상태 ──
  const [point, setPoint] = useState(item.pointRewarded ?? 0);
  const [comment, setComment] = useState(item.rewardedComment ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(
    item.WPR_status === PRICE_STATUS_WAITING || item.WPR_status === PRICE_STATUS_PASS_BEFORE
  );
  const [rejectReason, setRejectReason] = useState(item.RPT_reason ?? '');

  // 아래 네 개는 “item이 바뀔 때마다 동기화(override)”가 필요한 부분
  const [showDetail, setShowDetail] = useState(item.WPR_showWineDetailPage === 1);
  const [showSpecial, setShowSpecial] = useState(item.WPR_showSpecialPricePage === 1);
  const [stockCount, setStockCount] = useState(
    item.WPR_stockCount != null ? item.WPR_stockCount : ''
  );
  const [neededPoint, setNeededPoint] = useState(item.WPR_point ?? 0);
  const [hasReceipt, setHasReceipt] = useState(item.WPR_receipt === 1);

  const [pushForReviewPass, setPushForReviewPass] = useState(item.WPR_status === PRICE_STATUS_REJECT); // 등록/통과 시 푸시 기본 값은 꺼짐으로
  const [pushForReviewReject, setPushForReviewReject] = useState(true);   // 거절 시 푸시

  // ── 2) item 변화를 감지해서 로컬 state 덮어쓰기 ──
  useEffect(() => {
    setPoint(item.pointRewarded ?? 0);
  }, [item.pointRewarded]);

  useEffect(() => {
    setComment(item.rewardedComment ?? '');
  }, [item.rewardedComment]);

  useEffect(() => {
    setRejectReason(item.RPT_reason ?? '');
  }, [item.RPT_reason]);

  useEffect(() => {
    setIsExpanded(
      item.WPR_status === PRICE_STATUS_WAITING || item.WPR_status === PRICE_STATUS_PASS_BEFORE
    );
  }, [item.WPR_status]);

  useEffect(() => {
    setShowDetail(item.WPR_showWineDetailPage === 1);
  }, [item.WPR_showWineDetailPage]);

  useEffect(() => {
    setShowSpecial(item.WPR_showSpecialPricePage === 1);
  }, [item.WPR_showSpecialPricePage]);

  useEffect(() => {
    setStockCount(item.WPR_stockCount != null ? item.WPR_stockCount : '');
  }, [item.WPR_stockCount]);

  useEffect(() => {
    setNeededPoint(item.WPR_point ?? 0);
  }, [item.WPR_point]);

  useEffect(() => {
    setHasReceipt(item.WPR_receipt === 1);
  }, [item.WPR_receipt]);

  useEffect(() => {
    setFirstLevel(
      FIRST_LEVEL_VALUES.find(v => item.writer.level >= v && item.writer.level < v + 10) ?? null
    );
    setSecondLevel(
      SECOND_LEVEL_VALUES.includes(item.writer.level % 10) ? item.writer.level % 10 : 0
    );
  }, [item.writer.level]);


  const originalLevel = item.writer.level;
  // 1) 첫/두 번째 드롭다운 초기값
  const [firstLevel, setFirstLevel] = useState(
    FIRST_LEVEL_VALUES.find(v => originalLevel >= v && originalLevel < v + 10) ?? null
  );

  const [secondLevel, setSecondLevel] = useState(
    SECOND_LEVEL_VALUES.includes(originalLevel % 10) ? originalLevel % 10 : 0
  );

  // 2) 저장 버튼 토글
  const combinedLevel = (firstLevel ?? 0) + (secondLevel ?? 0);
  const showLevelSave = combinedLevel !== originalLevel;

  // 3) 저장 핸들러
  const handleLevelSave = async () => {
    try {
      await updateUserLevel(item.writer.index, combinedLevel);
      toast.success(`레벨이 "${levelTitle(combinedLevel)}" 로 변경되었습니다`);
      emitChange({ writer: { ...item.writer, level: combinedLevel } });

      if (window.confirm('변경 알림(푸시)을 사용자에게 보낼까요?')) {
        try {
          const fresh = await getUserByIndex(item.writer.index);
          const token = fresh?.deviceToken || item.writer?.deviceToken;
          if (token) {
            await pushUserLevelChanged({
              token: token,
              userIndex: item.writer.index,
              level: combinedLevel,
            });
            toast.success('레벨 변경 알림을 발송했습니다.');
          } else {
            toast.error('기기 토큰이 없어 알림 발송을 건너뜁니다.');
          }
        } catch (pushErr) {
          toast.error('레벨 변경 알림 발송에 실패했습니다.');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('레벨 변경에 실패했습니다');
    }
  };

  const handleTogglePhotoVisibility = async (photoIndex, currentlyHidden, baseType) => {
    const newType = currentlyHidden ? baseType : baseType + 10;
    const success = await updatePhotoType(photoIndex, newType);
    if (!success) return;

    const updatedPhotos = item.attachedPhotos.map(p =>
      p.WPH_index === photoIndex ? { ...p, WPH_type: newType } : p
    );
    emitChange({ attachedPhotos: updatedPhotos });
  };

  const emitChange = useCallback((changes) => {
    onItemChange(item.WPR_index, changes);
  }, [item.WPR_index, onItemChange]);

  // --- 메인 노출 스위치 핸들러 ---
  const toggleShowDetail = async (e) => {
    const next = e.target.checked;
    setShowDetail(next);
    try {
      await setShowInWineDetailPage(next, item.WPR_index);
      emitChange({ WPR_showWineDetailPage: next ? 1 : 0 });
    } catch (err) {
      console.error(err);
      // 실패 시 롤백
      setShowDetail(!next);
    }
  };

  // --- 특가 스위치 핸들러 ---
  const toggleShowSpecial = async (e) => {
    const next = e.target.checked;
    setShowSpecial(next);

    try {
      // 서버 플래그 반영
      await setShowInSpecialPricePage(next, item.WPR_index);
      emitChange({ WPR_showSpecialPricePage: next ? 1 : 0 });

      // 켜질 때만 푸시 확인 + 발송
      if (next) {
        const ok = window.confirm('특가 알림을 발송하시겠습니까?');
        if (ok) {
          // Java 로직 기준: needsLock = 포인트 필요 여부
          const needsLock = (item.WPR_point ?? neededPoint ?? 0) > 0;

          const { title, body } = buildHotDealMessage({
            titleKR: item.WIN_titleKR,
            vintage: item.WPR_vintage,
            finalPrice: item.WPR_finalPrice ?? item.WPR_price,
            needsLock,
          });

          // 기존 서버가 data에 priceIndex만 넣던 흐름과 싱크
          const data = { priceIndex: String(item.WPR_index ?? '') };

          await sendPushToTopic({ topic: 'hotDeal', title, body, data });
          toast.success('핫딜 푸시가 발송되었습니다.');
        }
      }
    } catch (err) {
      console.error(err);
      setShowSpecial(!next);            // 실패 시 롤백
      toast.error('특가 상태 변경에 실패했습니다.');
    }
  };

  // --- 재고 드롭다운 핸들러 ---
  const changeStock = async (e) => {
    const val = e.target.value;
    setStockCount(val);

    // 모름이면 null, 아니면 숫자
    const payload = val === '' ? null : Number(val);

    try {
      await setStockCountOfPrice(payload, item.WPR_index);
      emitChange({ WPR_stockCount: payload });
    } catch (err) {
      console.error('재고 업데이트 실패:', err);
      // 실패 시 원래 값으로 롤백
      setStockCount(item.WPR_stockCount != null ? item.WPR_stockCount : '');
    }
  };

  // --- 열람 포인트 드롭다운 핸들러 ---
  const changeNeededPoint = async (e) => {
    const next = Number(e.target.value);
    setNeededPoint(next);
    try {
      await setNeededPointForShowOfPrice(next, item.WPR_index);
      emitChange({ WPR_point: next });
    } catch (err) {
      console.error(err);
      setNeededPoint(item.WPR_point ?? 0);
    }
  };

  // --- 영수증 인증 스위치 핸들러 ---
  const toggleReceipt = async (e) => {
    const next = e.target.checked;
    setHasReceipt(next);
    try {
      await setHasReceiptOfPrice(next, item.WPR_index);
      emitChange({ WPR_receipt: next ? 1 : 0 });
    } catch (err) {
      console.error(err);
      setHasReceipt(!next);
    }
  };


  const statusLabel = statusOptions.find(s => s.code === item.WPR_status)?.label ?? '알수없음';
  const handlePointSave = async () => {
    try {
      setIsSubmitting(true);

      if (item.RPT_index) {
        await deleteReportForPrice(item.RPT_index);
        emitChange({
          RPT_index: null,
          RPT_reason: null,
          RPT_datetime: null,
        });
        toast.success('거절 사유가 삭제 되었습니다.');
      }

      if (item.WPR_status != PRICE_STATUS_PASS) {
        await updateWinePriceStatus(PRICE_STATUS_PASS, item.WPR_index, null)
        toast.success('상태가 등록으로 변경되었습니다');
        // wine 도 사용자가 첫 등록한 데이터일 경우 wine 의 status 도 pass 로 변경 (내부에서 pass일 경우는 건드리지 않고 나머지일 경우만 INCOMPLETE 로 변경하도록 쿼리)
        await updateWineStatusToIncompleteIfNotPass(item.WPR_wineIndex);
      }

      if (pushForReviewPass) { // 아래 return 블록이 있어서 그 전에 호출
        const priceIndexStr = String(item.WPR_index ?? '');
        const messagePass = String(item.WIN_titleKR ?? '').trim() || '심사 통과';
        try {
          const user = await getUserByIndex(item.writer.index);
          if (user?.deviceToken) {
            await pushPriceReview({
              token: user.deviceToken,
              userIndex: user.index,
              priceIndex: priceIndexStr,
              title: '가격 등록 완료',
              message: messagePass,
            });
            toast.success('심사 결과 푸시를 발송했습니다.');
          } else {
            toast.error('기기 토큰이 없어 푸시를 건너뜀');
          }
        } catch (pushErr) {
          console.error('푸시 발송 실패:', pushErr);
          toast.error('푸시 발송에 실패했습니다.');
        }
      }

      const hasHistory = !!item.PHI_index;
      if (!hasHistory && point === 0 && comment.trim() === '') { // 포인트 없이 등록만 시키는 경우는 포인트 내역 삽입할 필요 없음.
        setIsSubmitting(false);
        emitChange({
          WPR_status: PRICE_STATUS_PASS,      // 상태 변경까지 반영
        });
        return;
      }

      let newPoint = item.writer?.point;
      if (hasHistory) {
        await updatePointForWritePrice(item.writer?.index, item.PHI_index, point, comment);
        newPoint = newPoint - (item.pointRewarded ?? 0) + point;
      } else {
        const index = await insertPointForWritePrice(item.writer?.index, item.WPR_index, point, comment);
        newPoint = newPoint + point;
        emitChange({
          PHI_index: index
        });
      }
      toast.success('포인트 저장 완료');
      emitChange({
        pointRewarded: point,
        rewardedComment: comment,
        WPR_status: PRICE_STATUS_PASS,      // 상태 변경까지 반영
        writer: {
          ...item.writer,
          point: newPoint
        }
      });

    } catch (err) {
      console.error('포인트 저장 실패', err);
      toast.error('저장 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 심사(대기/선등록) 상태인지 여부
  const isReviewRequired =
    item.WPR_status === PRICE_STATUS_WAITING ||
    item.WPR_status === PRICE_STATUS_PASS_BEFORE;

  const isPointChanged = point !== (item.pointRewarded ?? 0) || comment !== (item.rewardedComment ?? '');

  // 1) 신고 이력 유무
  const hasReport = !!item.RPT_index;
  // 2) 입력된 사유 (앞뒤 공백 제거)
  const trimmedReason = rejectReason.trim();
  // 3) 제출 가능 여부
  //    - 빈 문자열 아니어야 하고
  //    - (이력 있을 땐) 기존 이력과 달라야 함
  const canSubmitReport =
    trimmedReason.length > 0 &&
    (!hasReport || trimmedReason !== (item.RPT_reason ?? '').trim());

  // 4) 클릭 핸들러 분리
  const handleReportSubmit = async () => {
    if (!canSubmitReport) return;

    setIsSubmitting(true);
    try {
      if (item.PHI_index) {
        const newPoint = item.writer?.point - item.pointRewarded;
        await deletePointHistoryWithSyncUserPoint(item.writer?.index, item.PHI_index)
        toast.error('포인트 내역이 삭제되었습니다.');
        emitChange({
          PHI_index: null,
          PHI_datetime: null,
          pointRewarded: null,
          rewardedComment: null,
          writer: {
            ...item.writer,
            point: newPoint
          }
        });
      }

      if (hasReport) {
        await updateReportForPrice(item.RPT_index, trimmedReason);
        toast.success('신고 수정 완료');
      } else {
        const now = new Date();
        const formatted = now
          .toISOString()         // "2025-05-26T14:23:45.678Z"
          .slice(0, 19)          // "2025-05-26T14:23:45"
          .replace('T', ' ');    // "2025-05-26 14:23:45"

        const newIndex = await insertReportForPrice(item.writer?.index, item.WPR_index, trimmedReason);
        emitChange({
          RPT_index: newIndex,
          RPT_datetime: formatted,
        });
        toast.success('신고 등록 완료');
      }

      if (item.WPR_status != PRICE_STATUS_REJECT) {
        await updateWinePriceStatus(PRICE_STATUS_REJECT, item.WPR_index, 0)
      }

      emitChange({
        RPT_reason: trimmedReason,
        WPR_status: PRICE_STATUS_REJECT,
      });

      // 4) 사용자 푸시 (가격 심사 결과)
      if (pushForReviewReject) {
        const priceIndexStr = String(item.WPR_index ?? '');
        const messageReject = trimmedReason || '심사 거절';

        try {
          const user = await getUserByIndex(item.writer.index);
          if (user?.deviceToken) {
            await pushPriceReview({
              token: user.deviceToken,
              userIndex: user.index,
              priceIndex: priceIndexStr,
              title: '가격 등록 실패',
              message: messageReject,   // 거절 사유
            });
            toast.success('심사 결과 푸시를 발송했습니다.');
          } else {
            toast.error('기기 토큰이 없어 푸시를 건너뜀');
          }
        } catch (pushErr) {
          console.error('푸시 발송 실패:', pushErr);
          toast.error('푸시 발송에 실패했습니다.');
        }
      }

      // 필요 시 부모 콜백 호출…
    } catch (e) {
      console.error(e);
      toast.error('실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      setIsSubmitting(true);

      if (item.WPR_index) {
        await deletePriceWithRelatedData(item.WPR_index, item.WPR_wineIndex);
        toast.success('삭제 완료');
        emitChange({
          WPR_index: null,
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('삭제 실패');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="price-cell-wrapper">
      <div className="meta-row">
        <div className="registered-date">등록일: {toLocalDisplay(item.WPR_registered)}</div>
        <div className="switch-group-inline">
          <div className="switch-row">
            <span className="switch-label">메인노출</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={showDetail}
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
                checked={showSpecial}
                onChange={toggleShowSpecial}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>
      <div className="price-card">
        <div className="card-top">
          <div className="wine-info-and-photo-group">
            <div className="wine-info-section"
              {...wineGuard.handlers}
              onClick={wineGuard.guardClick(() => onClickWineSection(item))}
            >
              <div className="thumbnail-container">
                {item.WIN_thumbnailURL ? (
                  <img src={item.WIN_thumbnailURL} alt="thumb" />
                ) : (
                  <div className="thumbnail-placeholder"><FaImage size={16} color="#999" /></div>
                )}
              </div>
              <div className="wine-names">
                <div className="title">{item.WIN_titleKR}</div>
                <div className="subtitle">{item.WIN_title}</div>
              </div>
            </div>
            {item.WPR_thumbnailURL?.trim().length > 0 && (
              <div className="photo-section">
                <div key={0} className="photo-block">
                  <a href={item.WPR_thumbnailURL} target="_blank" rel="noopener noreferrer" className="photo-thumbnail">
                    <img src={item.WPR_thumbnailURL} alt={`photo-${0}`} className={''} />
                  </a>
                </div>
              </div>
            )}
            {item.attachedPhotos?.length > 0 && (
              <div className="photo-section">
                {/* ← 추가: 영수증 인증 헤더 */}
                <div className="photo-section-header">
                  <span className="header-title">영수증 인증</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={hasReceipt}
                      onChange={toggleReceipt}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="attached-photos">
                  {item.attachedPhotos.map((photo, idx) => {
                    const isHidden = photo.WPH_type >= 10;
                    const visibleType = isHidden ? photo.WPH_type - 10 : photo.WPH_type;
                    return (
                      <div key={idx} className="photo-block">
                        <a href={photo.WPH_url} target="_blank" rel="noopener noreferrer" className="photo-thumbnail">
                          <img src={photo.WPH_url} alt={`photo-${idx}`} className={isHidden ? 'hidden' : ''} />
                        </a>
                        <div className="photo-switch">
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={!isHidden}
                              onChange={() =>
                                // onTogglePhotoVisibility?.(photo.WPH_index, isHidden, visibleType)
                                handleTogglePhotoVisibility(photo.WPH_index, isHidden, visibleType)
                              }
                            />
                            <span className="slider"></span>
                          </label>
                          <span className="switch-label">공개</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div
            className="middle-info-group"
            {...middleGuard.handlers}
            onClick={middleGuard.guardClick(onClickPriceEdit)}
          >
            <div className="middle-info-section">
              <div className="sale-date">판매일: {toLocalDisplay(item.WPR_datetime)}</div>
              <div className="meta">{item.WPR_vintage} / {item.WPR_bottleSize}ml</div>
              <div
                className="shop"
                {...shopGuard.handlers}
                onClick={shopGuard.guardClick((e) => {
                  e.stopPropagation();        // 부모(middle) onClick 방지
                  onClickShop(item);
                })}
              >
                <b>{item.WSH_title}</b> {item.WSH_branch}
              </div>

              <div className="price">
                <span className="currency">
                  {formatPrice(item.WPR_price, item.WSH_priceUnitCode)} →
                </span>
                {item.WPR_finalPrice?.toLocaleString()}원
              </div>

              {item.WPR_saleInfo && <div className="sale">{item.WPR_saleInfo}</div>}
              {item.WPR_comment && <div className="comment">{item.WPR_comment}</div>}
              {item.WPR_purchaseLink && <a className="purchase-link" href={item.WPR_purchaseLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>구매 링크 열기</a>}
              <div className="dropdown-group">
                <div className="dropdown-row">
                  <span className="dropdown-label">재고</span>
                  <select
                    className="dropdown"
                    value={stockCount}
                    onChange={changeStock}
                    onClick={e => e.stopPropagation()}
                  >
                    <option value="">모름</option>
                    {Array.from({ length: 101 }, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                    {[200, 300, 400, 500, 600, 700, 800, 900, 1000].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
                <div className="dropdown-row">
                  <span className="dropdown-label">열람 포인트</span>
                  <select
                    className="dropdown"
                    value={neededPoint}
                    onChange={changeNeededPoint}
                    onClick={e => e.stopPropagation()}
                  >
                    {Array.from({ length: 21 }, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="writer-section">
            <div className="nickname" onClick={() => onClickUser(item)}>
              {item.writer?.nickname}{item.WPR_hideWriter ? ' (숨김)' : ''}
            </div>

            {/* --- 사용자 레벨 변경 영역 --- */}
            <div className="level-section">
              <div className="level-label">레벨 {item.writer.level}</div>
              {item.writer.level != MIN_LEVEL_ADMIN && (
                <div className="level-dropdowns">
                  <select
                    className="level-select"
                    value={firstLevel ?? ''}
                    onChange={e => setFirstLevel(
                      e.target.value === '' ? null : Number(e.target.value)
                    )}
                  >
                    <option value="">해당없음</option>
                    {FIRST_LEVEL_VALUES.map(v => (
                      <option key={v} value={v}>
                        {levelTitle(v)}
                      </option>
                    ))}
                  </select>

                  <select
                    className="level-select"
                    value={secondLevel ?? ''}
                    onChange={e => setSecondLevel(
                      e.target.value === '' ? null : Number(e.target.value)
                    )}
                  >
                    {SECOND_LEVEL_VALUES.map(v => (
                      <option key={v} value={v}>
                        {levelTitle(v)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {item.writer.level != MIN_LEVEL_ADMIN && showLevelSave && (
                <div className="level-save-row">
                  <button
                    className="level-save-button"
                    onClick={handleLevelSave}
                  >
                    변경
                  </button>
                </div>
              )}
            </div>

            <div className="point">{item.writer?.point?.toLocaleString()} pts</div>
          </div>
        </div>

        <button
          type="button"
          className="compare-button"
          onClick={() => onClickSeeHistory(item.WPR_wineIndex)}
        >
          가격비교
        </button>
        <div
          className={`status-badge ${item.WPR_status === PRICE_STATUS_WAITING ? 'bottom' :
            item.WPR_status === PRICE_STATUS_PASS_BEFORE ? 'bottom' :
              item.WPR_status === PRICE_STATUS_REJECT ? 'rejected' :
                item.WPR_status === PRICE_STATUS_DELETED ? 'deleted' :
                  ''
            }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {statusLabel}
        </div>
      </div>

      {
        isExpanded && (
          <>
            <div
              className={`card-row${isReviewRequired ? ' review-required' : ''}`}
            >
              <div className={`highlight-box ${!!item.PHI_datetime ? 'highlight-primary' : ''}`}>
                <div className="dialog-title-row">
                  <div className="dialog-title">
                    {(item.WPR_status === PRICE_STATUS_PASS ? '등록 상태 수정' : '등록 상태로 변경') +
                      (item.PHI_datetime ? ' (최근 포인트:' + toLocalDisplay(item.PHI_datetime) + ')' : '')}
                  </div>
                  <div className="push-toggle">
                    <span className="push-toggle__label">푸시 보내기</span>
                    <label className="switch small">
                      <input
                        type="checkbox"
                        checked={pushForReviewPass}
                        onChange={(e) => setPushForReviewPass(e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
                <div className="point-segment-group">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button
                      key={i}
                      className={`segment-button ${point === i ? 'active' : ''}`}
                      onClick={() => setPoint(i)}
                      disabled={isSubmitting}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="memo-input large"
                  placeholder="메모 입력"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="separator" />
                <button
                  className={`dialog-button ${isPointChanged || item.PHI_index == null ? '' : 'disabled'}`}
                  onClick={handlePointSave}
                  disabled={isSubmitting || (!isPointChanged && item.PHI_index != null)}
                >
                  {isSubmitting ? '저장 중...' : (item.pointRewarded != null ? '수정' : '등록')}
                </button>
              </div>

              <div className={`highlight-box ${item.RPT_reason ? 'highlight-rejected' : ''}`}>
                <div className="dialog-title-row">
                  <div className="dialog-title">
                    {(item.WPR_status === PRICE_STATUS_REJECT ? '거절 상태 수정' : '거절 상태로 변경') +
                      (item.RPT_datetime ? ' (최근 내역:' + toLocalDisplay(item.RPT_datetime) + ')' : '')}
                  </div>
                  <div className="push-toggle">
                    <span className="push-toggle__label">푸시 보내기</span>
                    <label className="switch small">
                      <input
                        type="checkbox"
                        checked={pushForReviewReject}
                        onChange={(e) => setPushForReviewReject(e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
                <div className="tag-group">
                  {[
                    { title: '영수증', content: '정보 인증이 가능한 매대 가격표(영수증) 사진을 첨부해 주세요.' },
                    { title: '중복', content: '중복 등록' },
                    { title: '직접입력', content: '' },
                  ].map(({ title, content }) => (
                    <button
                      key={title}
                      className="tag-button"
                      onClick={() => setRejectReason(content)}
                    >
                      {title}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  className="memo-input large"
                  placeholder="거절 사유 입력"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="separator" />
                <button
                  className={`dialog-button ${canSubmitReport ? '' : 'disabled'}`}
                  disabled={!canSubmitReport || isSubmitting}
                  onClick={handleReportSubmit}
                >
                  {hasReport ? '수정' : '등록'}
                </button>
              </div>

              <div className="box-header">
                <button className="delete-button" onClick={() => handleDelete(item)}>
                  🗑️
                </button>
                <button
                  className="clone-button"
                  onClick={() => onClickClone(item)}
                >
                  복제
                </button>
              </div>
            </div>
          </>
        )
      }
    </div >
  );
}
