import { Language } from '../../types';
// New view controls also include Russian and Tajik translations.
const rows=String.raw`Decrease|Уменьшить|Кам кардан|Diminuer|Reducir|减少|تقليل
Increase|Увеличить|Зиёд кардан|Augmenter|Aumentar|增加|زيادة
Panels|Панели|Панелҳо|Panneaux|Paneles|面板|اللوحات
Status bar|Строка состояния|Сатри ҳолат|Barre d’état|Barra de estado|状态栏|شريط الحالة
Ribbon|Лента|Тасма|Ruban|Cinta|功能区|الشريط
Canvas|Холст|Саҳна|Toile|Lienzo|画布|اللوحة
Snap to objects|Привязка к объектам|Часпидан ба объектҳо|Alignement magnétique|Ajustar a objetos|吸附到对象|محاذاة إلى العناصر
Alignment guides|Направляющие|Хатҳои роҳнамо|Repères d’alignement|Guías de alineación|对齐参考线|أدلة المحاذاة
Grid spacing|Шаг сетки|Қадами панҷара|Pas de grille|Paso de cuadrícula|网格间距|تباعد الشبكة
Canvas zoom|Масштаб холста|Миқёси саҳна|Zoom de la toile|Zoom del lienzo|画布缩放|تكبير اللوحة
Fit page|Вписать страницу|Ҷойгир кардани саҳифа|Ajuster la page|Ajustar página|适合页面|ملاءمة الصفحة
Actual size|Реальный размер|Андозаи аслӣ|Taille réelle|Tamaño real|实际大小|الحجم الفعلي
Interface scale|Масштаб интерфейса|Миқёси интерфейс|Échelle de l’interface|Escala de interfaz|界面缩放|حجم الواجهة
Reset interface scale|Сбросить масштаб интерфейса|Барқарор кардани миқёси интерфейс|Réinitialiser l’échelle|Restablecer escala de interfaz|重置界面缩放|إعادة حجم الواجهة
Theme|Тема|Мавзӯъ|Thème|Tema|主题|المظهر
System theme|Как в системе|Мисли система|Thème du système|Tema del sistema|跟随系统|حسب النظام
Workspace|Рабочее пространство|Фазои корӣ|Espace de travail|Espacio de trabajo|工作区|مساحة العمل
Focus mode|Режим фокуса|Реҷаи тамаркуз|Mode concentration|Modo de concentración|专注模式|وضع التركيز
Exit focus mode|Выйти из режима фокуса|Баромадан аз реҷаи тамаркуз|Quitter le mode concentration|Salir del modo de concentración|退出专注模式|الخروج من وضع التركيز
Reset view|Сбросить вид|Барқарор кардани намуд|Réinitialiser l’affichage|Restablecer vista|重置视图|إعادة ضبط العرض
Layer|Слой|Қабат|Calque|Capa|图层|طبقة
Choose a file|Выбрать файл|Интихоби файл|Choisir un fichier|Elegir archivo|选择文件|اختيار ملف
Replace file|Заменить файл…|Иваз кардани файл…|Remplacer le fichier…|Reemplazar archivo…|替换文件…|استبدال الملف…
Opening|Открытие…|Кушодан…|Ouverture…|Abriendo…|正在打开…|جارٍ الفتح…
Embedded file|Файл в проекте|Файл дар лоиҳа|Fichier intégré|Archivo integrado|内嵌文件|ملف مضمّن
Linked media|Источник по ссылке|Манбаъ аз пайванд|Média lié|Medio enlazado|链接媒体|وسائط مرتبطة
Use a URL|Указать ссылку|Нишон додани пайванд|Utiliser une URL|Usar URL|使用链接|استخدام رابط
Media URL|Ссылка на медиафайл|Пайванди файли медиа|URL du média|URL del archivo multimedia|媒体链接|رابط الوسائط
Settings saved automatically|Настройки сохраняются автоматически|Танзимот худкор захира мешавад|Paramètres enregistrés automatiquement|Los ajustes se guardan automáticamente|设置会自动保存|تُحفظ الإعدادات تلقائيًا`;
const codes=['ru','tj','fr','es','zh','ar'] as const;
export const viewTranslations:Record<string,Partial<Record<Language,string>>>=Object.fromEntries(rows.split('\n').map(row=>{
  const [key,...values]=row.split('|');
  return [key,Object.fromEntries(codes.map((code,index)=>[code,values[index]]))];
}));
