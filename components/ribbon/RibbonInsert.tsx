import React, { useState, useRef, useCallback } from 'react';
import {
  Square, Type, Image as ImageIcon, Layout, Shapes, Minus, Video
} from 'lucide-react';
import { useMediaImport } from '../../hooks/useMediaImport';
import { MediaImportFeedback } from '../media/MediaImportFeedback';
import { Popover } from '../ui/Popover';
import { SHAPE_GROUPS, SHAPE_LABELS } from '../ui/ShapeIcon';
import { ElementType } from '../../types';
import { RibbonGroup, BigButton, ShapeButton } from './RibbonShared';
import { t } from '../../utils/localization';
import { useEditorStore } from '../../store/useEditorStore';

export const RibbonInsert = React.memo(() => {
  const { language, setInsertMode, project, activeLayerId } = useEditorStore();
  const {busy,error,dismissError,pickAndInsert}=useMediaImport();
  const layer=project.pages.find(p=>p.id===project.activePageId)?.layers.find(l=>l.id===activeLayerId);
  const canImport=!!layer?.visible&&!layer.locked;
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const closeShapes = useCallback(() => setShowShapesMenu(false), []);
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
        <MediaImportFeedback busy={busy} error={error} onDismiss={dismissError}/>
        <BigButton icon={ImageIcon} label={t('Image', language)} disabled={busy||!canImport} onClick={() => void pickAndInsert('image')} />
        <BigButton icon={Video} label={t('Video', language)} disabled={busy||!canImport} onClick={() => void pickAndInsert('video')} />
      </RibbonGroup>
      <RibbonGroup label={t('Shapes', language)}>
        <div className="relative h-full">
          <BigButton
            refProp={shapesButtonRef}
            icon={Shapes} label={t('Shapes', language)} dropdown
            onClick={() => setShowShapesMenu(s => !s)}
            active={showShapesMenu}
          />
          <Popover open={showShapesMenu} onClose={closeShapes} anchor={shapesButtonRef} title={t('Shapes', language)} width={340}>
            <div className="space-y-2">
              {SHAPE_GROUPS.map(group => <section key={group.label}>
                <h4 className="gallery-section-label">{t(group.label, language)}</h4>
                <div className="grid grid-cols-6 gap-1">
                  {group.types.map(type => <ShapeButton key={type} type={type} label={t(SHAPE_LABELS[type], language)} onClick={handleSetInsertMode} />)}
                </div>
              </section>)}
            </div>
          </Popover>
        </div>
      </RibbonGroup>
    </>
  );
});
