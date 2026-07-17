import React, { useState, useRef } from 'react';
import {
  Square, Circle, Type, Image as ImageIcon, Layout, Shapes, Minus, Video
} from 'lucide-react';
import { ElementType } from '../../types';
import { RibbonGroup, BigButton, ShapeButton } from './RibbonShared';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';

export const RibbonInsert = React.memo(() => {
  const { language, setInsertMode } = useEditorStore();
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const shapesButtonRef = useRef<HTMLButtonElement>(null);

  const handleSetInsertMode = (type: ElementType) => {
    setInsertMode(type);
    setShowShapesMenu(false);
  };

  return (
    <>
      <RibbonGroup label={t('Basic', language)}>
        <BigButton icon={Type} label={t('Text', language)} onClick={() => handleSetInsertMode('text')} />
        <BigButton icon={Layout} label={t('Button', language)} onClick={() => handleSetInsertMode('button')} />
        <BigButton icon={Square} label={t('Box', language)} onClick={() => handleSetInsertMode('rect')} />
      </RibbonGroup>
      <RibbonGroup label={t('Media', language)}>
        <BigButton icon={ImageIcon} label={t('Image', language)} onClick={() => handleSetInsertMode('image')} />
        <BigButton icon={Video} label={t('Video', language)} onClick={() => handleSetInsertMode('video')} />
      </RibbonGroup>
      <RibbonGroup label={t('Shapes', language)}>
        <div className="relative h-full">
          <BigButton
            refProp={shapesButtonRef}
            icon={Shapes} label={t('Shapes', language)} dropdown
            onClick={() => setShowShapesMenu(s => !s)}
            active={showShapesMenu}
          />
          {showShapesMenu && (
            <div className="fixed top-[130px] left-[250px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-2xl rounded-xl p-4 w-[400px] z-[9999] animate-in fade-in zoom-in-95 duration-100">
              <div className="grid grid-cols-6 gap-2">
                <div className="col-span-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t('Basic', language)} {t('Shapes', language)}</div>
                <ShapeButton type="rect" label={t('Rect', language)} icon={Square} onClick={handleSetInsertMode} />
                <ShapeButton type="roundedRect" label={t('Round', language)} icon={Square} onClick={handleSetInsertMode} />
                <ShapeButton type="circle" label={t('Circle', language)} icon={Circle} onClick={handleSetInsertMode} />
                <ShapeButton type="line" label={t('Line', language)} icon={Minus} onClick={handleSetInsertMode} />
                <ShapeButton type="triangle" label={t('Tri', language)} onClick={handleSetInsertMode} />
                <ShapeButton type="rightTriangle" label="RtTri" onClick={handleSetInsertMode} />
                <ShapeButton type="diamond" label="Diamond" onClick={handleSetInsertMode} />
                <ShapeButton type="star" label={t('Star', language)} onClick={handleSetInsertMode} />
                <ShapeButton type="arrowRight" label={t('Arrow', language)} onClick={handleSetInsertMode} />
                <ShapeButton type="heart" label={t('Heart', language)} onClick={handleSetInsertMode} />
              </div>
            </div>
          )}
          {showShapesMenu && (
            <div className="fixed inset-0 z-[9998]" onClick={() => setShowShapesMenu(false)}></div>
          )}
        </div>
      </RibbonGroup>
    </>
  );
});
