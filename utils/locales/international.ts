import { Language } from '../../types';
// Columns: translation key | French | Spanish | Simplified Chinese | Arabic.
const rows=String.raw`Shaders|Shaders|Sombreadores|着色器|المظللات
Start menu|Menu principal|Menú principal|主菜单|القائمة الرئيسية
Back to editor|Retour à l’éditeur|Volver al editor|返回编辑器|العودة إلى المحرر
Create|Créer|Crear|创建|إنشاء
Your ideas. Your website.|Vos idées. Votre site.|Tus ideas. Tu sitio web.|你的创意，你的网站。|أفكارك. موقعك.
Create with PowerWeb|Créez avec PowerWeb|Crea con PowerWeb|使用 PowerWeb 创作|أنشئ باستخدام PowerWeb
Welcome to your workspace|Bienvenue dans votre espace|Bienvenido a tu espacio de trabajo|欢迎来到工作区|مرحبًا بك في مساحة العمل
Good night|Bonne nuit|Buenas noches|夜深了|ليلة سعيدة
Good morning|Bonjour|Buenos días|早上好|صباح الخير
Good afternoon|Bon après-midi|Buenas tardes|下午好|طاب مساؤك
Good evening|Bonsoir|Buenas noches|晚上好|مساء الخير
Create a project|Créer un projet|Crear un proyecto|创建项目|إنشاء مشروع
Open a project|Ouvrir un projet|Abrir un proyecto|打开项目|فتح مشروع
Continue with a .pwb file or a local copy.|Ouvrez un fichier .pwb ou une copie locale.|Abre un archivo .pwb o una copia local.|打开 .pwb 文件或本地副本。|افتح ملف ‎.pwb أو نسخة محلية.
Every great website starts with an idea.|Un beau site commence par une idée.|Todo gran sitio empieza con una idea.|每个出色的网站都始于一个创意。|كل موقع رائع يبدأ بفكرة.
Continue editing|Continuer|Seguir editando|继续编辑|متابعة التحرير
Open from your device|Ouvrir depuis votre appareil|Abrir desde tu dispositivo|从设备打开|فتح من جهازك
Choose a PowerWeb project to continue working.|Choisissez un projet PowerWeb pour continuer.|Elige un proyecto PowerWeb para continuar.|选择一个 PowerWeb 项目以继续。|اختر مشروع PowerWeb لمتابعة العمل.
Choose .pwb file|Choisir un fichier .pwb|Elegir archivo .pwb|选择 .pwb 文件|اختيار ملف ‎.pwb
Choose your starting point|Choisissez votre point de départ|Elige cómo empezar|选择起点|اختر نقطة البداية
Blank project|Projet vierge|Proyecto vacío|空白项目|مشروع فارغ
A clean canvas for your ideas|Une toile vierge pour vos idées|Un lienzo en blanco para tus ideas|为创意准备的空白画布|لوحة فارغة لأفكارك
Creative studio|Studio créatif|Estudio creativo|创意工作室|استوديو إبداعي
A bold landing page|Une page d’accueil audacieuse|Una página de destino llamativa|醒目的落地页|صفحة هبوط مميزة
Portfolio|Portfolio|Portafolio|作品集|معرض الأعمال
A place for your best work|Vos meilleures réalisations|Un lugar para tus mejores trabajos|展示优秀作品的地方|مكان لأفضل أعمالك
Business|Entreprise|Negocio|商业|الأعمال
A clear introduction to your brand|Présentez votre marque|Una presentación clara de tu marca|清晰展示你的品牌|تعريف واضح بعلامتك التجارية
Recent projects|Projets récents|Proyectos recientes|最近项目|المشاريع الأخيرة
Project list|Liste des projets|Lista de proyectos|项目列表|قائمة المشاريع
Recent|Récents|Recientes|最近|الأخيرة
Pinned|Épinglés|Fijados|已固定|المثبتة
Find a project|Rechercher un projet|Buscar un proyecto|搜索项目|البحث عن مشروع
Local copies on this device. Save a .pwb file to keep a separate copy.|Copies locales sur cet appareil. Enregistrez un fichier .pwb pour conserver une copie distincte.|Copias locales en este dispositivo. Guarda un archivo .pwb para conservar otra copia.|此设备上的本地副本。保存 .pwb 文件可保留单独的副本。|نسخ محلية على هذا الجهاز. احفظ ملف ‎.pwb للاحتفاظ بنسخة منفصلة.
Last opened|Dernière ouverture|Última apertura|上次打开|آخر فتح
Name|Nom|Nombre|名称|الاسم
Local project|Projet local|Proyecto local|本地项目|مشروع محلي
pages|pages|páginas|页|صفحات
Pin|Épingler|Fijar|固定|تثبيت
Unpin|Désépingler|Desfijar|取消固定|إلغاء التثبيت
Remove from list|Retirer de la liste|Quitar de la lista|从列表中移除|إزالة من القائمة
No projects found|Aucun projet trouvé|No se encontraron proyectos|未找到项目|لم يتم العثور على مشاريع
Try a different project name.|Essayez un autre nom.|Prueba con otro nombre.|请尝试其他项目名称。|جرّب اسم مشروع آخر.
Keep your favourites close|Gardez vos favoris à portée de main|Ten tus favoritos a mano|常用项目，触手可及|احتفظ بمشاريعك المفضلة بالقرب منك
Pin a recent project to find it here.|Épinglez un projet récent pour le retrouver ici.|Fija un proyecto reciente para verlo aquí.|固定最近的项目，即可在此找到。|ثبّت مشروعًا حديثًا ليظهر هنا.
Your next project starts here|Votre prochain projet commence ici|Tu próximo proyecto empieza aquí|下一个项目从这里开始|مشروعك القادم يبدأ هنا
Create a new project or open an existing .pwb file.|Créez un projet ou ouvrez un fichier .pwb existant.|Crea un proyecto o abre un archivo .pwb existente.|创建新项目或打开现有 .pwb 文件。|أنشئ مشروعًا جديدًا أو افتح ملف ‎.pwb موجودًا.
Made for your next idea|Un espace pour votre prochaine idée|Un espacio para tu próxima idea|为下一个创意而生|مساحة لفكرتك القادمة
Could not update local projects. Your current work is still open.|Impossible de mettre à jour les projets locaux. Votre travail reste ouvert.|No se pudieron actualizar los proyectos locales. Tu trabajo sigue abierto.|无法更新本地项目，当前工作仍保持打开。|تعذّر تحديث المشاريع المحلية. عملك الحالي لا يزال مفتوحًا.
About · Work · Contact|À propos · Projets · Contact|Acerca de · Trabajos · Contacto|关于 · 作品 · 联系|نبذة · الأعمال · التواصل
Ideas become reality|Les idées deviennent réalité|Las ideas se hacen realidad|让创意成为现实|الأفكار تصبح واقعًا
Selected work.\nMade with purpose.|Projets choisis.\nPensés avec soin.|Trabajos destacados.\nCreados con propósito.|精选作品。\n用心创作。|أعمال مختارة.\nصُنعت بهدف.
Your next chapter\nstarts here.|Votre prochain chapitre\ncommence ici.|Tu próxima etapa\nempieza aquí.|新的篇章\n从这里开始。|فصلك القادم\nيبدأ هنا.
A short introduction to what you do and what makes it special.|Présentez votre activité et ce qui la rend unique.|Presenta lo que haces y qué lo hace especial.|简要介绍你的工作及其独特之处。|قدّم عملك باختصار وما يجعله مميزًا.
Let’s get started|Commençons|Empecemos|开始吧|لنبدأ
Built with PowerWeb. Make it yours.|Créé avec PowerWeb. Personnalisez-le.|Creado con PowerWeb. Hazlo tuyo.|使用 PowerWeb 构建，打造你的风格。|أُنشئ باستخدام PowerWeb. أضف لمستك.
Animation|Animation|Animación|动画|حركة
Add Animation|Ajouter une animation|Añadir animación|添加动画|إضافة حركة
Add Another Animation|Ajouter une autre animation|Añadir otra animación|再添加一个动画|إضافة حركة أخرى
Preview All Animations|Aperçu simultané|Vista previa conjunta|同时预览|معاينة الحركات معًا
Previous Animation|Animation précédente|Animación anterior|上一个动画|الحركة السابقة
Next Animation|Animation suivante|Animación siguiente|下一个动画|الحركة التالية
Duration Short|Temps|Tiempo|时间|الوقت
More|Plus|Más|更多|المزيد
More Tools|Autres outils|Más herramientas|更多工具|المزيد من الأدوات
Select an element to add animations|Sélectionnez un objet pour ajouter une animation|Selecciona un objeto para añadir animaciones|选择对象以添加动画|حدّد عنصرًا لإضافة حركة
Add Effect|Ajouter un effet|Añadir efecto|添加效果|إضافة تأثير
Animation categories|Catégories d’animations|Categorías de animación|动画分类|فئات الحركات
Collapse Ribbon|Réduire le ruban|Contraer cinta|折叠功能区|طي الشريط
Expand Ribbon|Développer le ruban|Expandir cinta|展开功能区|توسيع الشريط
Basic Shapes|Formes de base|Formas básicas|基本形状|الأشكال الأساسية
Polygons|Polygones|Polígonos|多边形|المضلعات
Arrows|Flèches|Flechas|箭头|الأسهم
Stars and Symbols|Étoiles et symboles|Estrellas y símbolos|星形与符号|النجوم والرموز
Rectangle|Rectangle|Rectángulo|矩形|مستطيل
Rounded Rectangle|Rectangle arrondi|Rectángulo redondeado|圆角矩形|مستطيل مستدير
Ellipse|Ellipse|Elipse|椭圆|شكل بيضاوي
Triangle|Triangle|Triángulo|三角形|مثلث
Right Triangle|Triangle rectangle|Triángulo rectángulo|直角三角形|مثلث قائم
Diamond|Losange|Rombo|菱形|معيّن
Parallelogram|Parallélogramme|Paralelogramo|平行四边形|متوازي أضلاع
Trapezoid|Trapèze|Trapecio|梯形|شبه منحرف
Pentagon|Pentagone|Pentágono|五边形|خماسي الأضلاع
Hexagon|Hexagone|Hexágono|六边形|سداسي الأضلاع
Octagon|Octogone|Octágono|八边形|ثماني الأضلاع
Right Arrow|Flèche droite|Flecha derecha|向右箭头|سهم لليمين
Left Arrow|Flèche gauche|Flecha izquierda|向左箭头|سهم لليسار
Up Arrow|Flèche haut|Flecha arriba|向上箭头|سهم للأعلى
Down Arrow|Flèche bas|Flecha abajo|向下箭头|سهم للأسفل
Five-point Star|Étoile à cinq branches|Estrella de cinco puntas|五角星|نجمة خماسية
Four-point Star|Étoile à quatre branches|Estrella de cuatro puntas|四角星|نجمة رباعية
Six-point Star|Étoile à six branches|Estrella de seis puntas|六角星|نجمة سداسية
Cross|Croix|Cruz|十字形|صليب
Callout|Bulle|Llamada|标注|وسيلة شرح
Animation Gallery|Galerie d’animations|Galería de animaciones|动画库|معرض الحركات
All Effects|Tous les effets|Todos los efectos|全部效果|كل التأثيرات
Applied|Appliqués|Aplicados|已应用|المطبّقة
Choose an effect from the gallery|Choisissez un effet dans la galerie|Elige un efecto de la galería|从效果库中选择效果|اختر تأثيرًا من المعرض
Start|Déclenchement|Inicio|启动|البدء
Seconds|s|s|秒|ث
Easing|Accélération|Suavizado|缓动|التنعيم
Repeat|Répétition|Repetición|重复|التكرار
Continuously|En continu|Continuamente|持续|باستمرار
Smooth|Fluide|Suave|平滑|سلس
Accelerate|Accélérer|Acelerar|加速|تسارع
Decelerate|Ralentir|Desacelerar|减速|تباطؤ
Soft start and end|Début et fin doux|Inicio y final suaves|平滑开始和结束|بداية ونهاية سلسة
Linear|Linéaire|Lineal|线性|خطي
Spring|Ressort|Resorte|弹簧|نابض
Fade In Left|Apparition par la gauche|Aparecer por la izquierda|从左淡入|ظهور من اليسار
Fade In Right|Apparition par la droite|Aparecer por la derecha|从右淡入|ظهور من اليمين
Zoom In Up|Zoom depuis le bas|Acercar desde abajo|从下放大进入|تكبير من الأسفل
Slide In Up|Glisser depuis le bas|Deslizar desde abajo|从下滑入|انزلاق من الأسفل
Slide In Left|Glisser depuis la gauche|Deslizar desde la izquierda|从左滑入|انزلاق من اليسار
Slide In Right|Glisser depuis la droite|Deslizar desde la derecha|从右滑入|انزلاق من اليمين
Flip In X|Retournement X|Voltear en X|沿 X 轴翻入|قلب حول X
Flip In Y|Retournement Y|Voltear en Y|沿 Y 轴翻入|قلب حول Y
Roll In|Entrée roulée|Entrar rodando|滚动进入|دخول متدحرج
Back In Down|Descente avec rebond|Entrar desde arriba con rebote|从上回弹进入|دخول مرتد من الأعلى
Back In Up|Montée avec rebond|Entrar desde abajo con rebote|从下回弹进入|دخول مرتد من الأسفل
Rotate In|Entrée en rotation|Entrar girando|旋转进入|دخول دوراني
Light Speed In|Entrée rapide|Entrada rápida|快速进入|دخول سريع
Swing|Balancement|Balanceo|摇摆|تأرجح
Rubber Band|Élastique|Elástico|弹性拉伸|تمدد مطاطي
Jello|Gelée|Gelatina|果冻|هلام
Wobble|Oscillation|Oscilación|摆动|تمايل
Tada|Accentuation|Énfasis|强调|إبراز
Flash|Clignotement|Destello|闪烁|وميض
Heart Beat|Battement de cœur|Latido|心跳|نبض القلب
Spin|Rotation|Giro|旋转|دوران
Float|Flottement|Flotar|浮动|طفو
Glow|Lueur|Resplandor|发光|توهج
Fade Out|Disparition|Desvanecer|淡出|اختفاء تدريجي
Zoom Out|Dézoom|Alejar|缩小|تصغير
Slide Out Down|Sortie vers le bas|Salir hacia abajo|向下滑出|خروج نحو الأسفل
Close|Fermer|Cerrar|关闭|إغلاق
Project name|Nom du projet|Nombre del proyecto|项目名称|اسم المشروع
Saved|Enregistré|Guardado|已保存|محفوظ
Unsaved changes|Modifications non enregistrées|Cambios sin guardar|有未保存的更改|تغييرات غير محفوظة
Dark theme|Thème sombre|Tema oscuro|深色主题|المظهر الداكن
Light theme|Thème clair|Tema claro|浅色主题|المظهر الفاتح
Tools|Outils|Herramientas|工具|الأدوات
Ready|Prêt|Listo|就绪|جاهز
Selected|Sélectionnés|Seleccionados|已选择|محدّد
Drawing|Dessin|Dibujando|绘制中|رسم
Zoom|Zoom|Zoom|缩放|التكبير
Page|Page|Página|页面|الصفحة
of|sur|de|/|من
Corner radius|Rayon des angles|Radio de esquinas|圆角半径|نصف قطر الزوايا
Border thickness|Épaisseur du contour|Grosor del borde|边框粗细|سُمك الحد
History|Historique|Historial|历史记录|السجل
Undo|Annuler|Deshacer|撤销|تراجع
Redo|Rétablir|Rehacer|重做|إعادة
Group|Grouper|Agrupar|组合|تجميع
Ungroup|Dissocier|Desagrupar|取消组合|فك التجميع
Arrange|Organiser|Organizar|排列|ترتيب
Export React|Exporter React|Exportar React|导出 React|تصدير React
Target|Cible|Destino|目标|الهدف
Home|Accueil|Inicio|主页|الرئيسية
Insert|Insertion|Insertar|插入|إدراج
Format|Format|Formato|格式|تنسيق
Logic|Logique|Lógica|逻辑|المنطق
Animations|Animations|Animaciones|动画|الحركات
View|Affichage|Vista|视图|عرض
Plugins|Extensions|Complementos|插件|الإضافات
File|Fichier|Archivo|文件|ملف
Open|Ouvrir|Abrir|打开|فتح
Save|Enregistrer|Guardar|保存|حفظ
Preview|Aperçu|Vista previa|预览|معاينة
Export|Exporter|Exportar|导出|تصدير
Clipboard|Presse-papiers|Portapapeles|剪贴板|الحافظة
Copy|Copier|Copiar|复制|نسخ
Paste|Coller|Pegar|粘贴|لصق
Delete|Supprimer|Eliminar|删除|حذف
Basic|Éléments de base|Básicos|基本|الأساسية
Text|Texte|Texto|文本|نص
Button|Bouton|Botón|按钮|زر
Box|Bloc|Bloque|色块|كتلة
Media|Médias|Multimedia|媒体|الوسائط
Image|Image|Imagen|图片|صورة
Video|Vidéo|Vídeo|视频|فيديو
Shapes|Formes|Formas|形状|الأشكال
Rect|Rectangle|Rectángulo|矩形|مستطيل
Round|Arrondi|Redondeado|圆角|مستدير
Circle|Cercle|Círculo|圆形|دائرة
Line|Ligne|Línea|线条|خط
Tri|Triangle|Triángulo|三角形|مثلث
Star|Étoile|Estrella|星形|نجمة
Arrow|Flèche|Flecha|箭头|سهم
Heart|Cœur|Corazón|心形|قلب
Geometry|Géométrie|Geometría|几何|الهندسة
Style|Style|Estilo|样式|النمط
Fill|Remplissage|Relleno|填充|تعبئة
Border|Contour|Borde|边框|الحد
Thickness|Épaisseur|Grosor|粗细|السُمك
Effects|Effets|Efectos|效果|التأثيرات
Opacity|Opacité|Opacidad|不透明度|العتامة
Radius|Rayon|Radio|半径|نصف القطر
Glass|Verre|Cristal|玻璃|زجاج
Typography|Typographie|Tipografía|排版|الطباعة
Text Color|Couleur du texte|Color del texto|文本颜色|لون النص
Border Color|Couleur du contour|Color del borde|边框颜色|لون الحد
Events|Événements|Eventos|事件|الأحداث
Actions|Actions|Acciones|操作|الإجراءات
On Click|Au clic|Al hacer clic|点击时|عند النقر
On Hover|Au survol|Al pasar el cursor|悬停时|عند التحويم
On Load|Au chargement|Al cargar|加载时|عند التحميل
On Scroll|Au défilement|Al desplazar|滚动时|عند التمرير
No animations added|Aucune animation ajoutée|No hay animaciones añadidas|尚未添加动画|لم تُضف حركات
Bring element to life|Animez votre objet avec le bouton ci-dessus.|Da vida al objeto con el botón de arriba.|点击上方按钮，让对象动起来。|حرّك العنصر باستخدام الزر أعلاه.
No Action|Aucune action|Sin acción|无操作|بلا إجراء
Go to Page|Aller à la page|Ir a la página|跳转页面|انتقال إلى الصفحة
Open URL|Ouvrir une URL|Abrir URL|打开链接|فتح رابط
Show Modal|Afficher une fenêtre|Mostrar ventana|显示弹窗|عرض نافذة
Action|Action|Acción|操作|إجراء
Target Page|Page cible|Página de destino|目标页面|الصفحة الهدف
URL|URL|URL|网址|الرابط
Font Family|Police|Fuente|字体|الخط
Backdrop Blur|Flou d’arrière-plan|Desenfoque de fondo|背景模糊|تمويه الخلفية
Autoplay|Lecture automatique|Reproducción automática|自动播放|تشغيل تلقائي
Loop|Boucle|Repetir|循环播放|تكرار
Muted|Muet|Sin sonido|静音|كتم الصوت
Add|Ajouter|Añadir|添加|إضافة
Quick Animate|Animation rapide|Animación rápida|快速动画|حركة سريعة
Entrance|Entrée|Entrada|进入|دخول
Attention|Accentuation|Énfasis|强调|لفت الانتباه
Fade In|Apparition|Aparecer|淡入|ظهور تدريجي
Fade In Up|Apparition par le bas|Aparecer desde abajo|从下淡入|ظهور من الأسفل
Fade In Down|Apparition par le haut|Aparecer desde arriba|从上淡入|ظهور من الأعلى
Slide Up|Glisser vers le haut|Deslizar hacia arriba|向上滑动|انزلاق للأعلى
Zoom In|Zoom avant|Acercar|放大|تكبير
Bounce In|Entrée avec rebond|Entrar rebotando|弹跳进入|دخول مرتد
Pulse|Pulsation|Pulso|脉冲|نبض
Shake|Secousse|Sacudir|抖动|اهتزاز
Bounce|Rebond|Rebote|弹跳|ارتداد
Scale Up|Agrandir|Aumentar|放大尺寸|زيادة الحجم
Continuous|En continu|Continuo|持续|مستمر
Exit|Sortie|Salida|退出|خروج
Interface|Interface|Interfaz|界面|الواجهة
Show Grid|Grille|Cuadrícula|网格|الشبكة
Show Layers|Calques|Capas|图层|الطبقات
Show Properties|Propriétés|Propiedades|属性|الخصائص
Language|Langue|Idioma|语言|اللغة
Page Settings|Paramètres de page|Ajustes de página|页面设置|إعدادات الصفحة
Dimensions|Dimensions|Dimensiones|尺寸|الأبعاد
Background|Arrière-plan|Fondo|背景|الخلفية
Props|Propriétés|Propiedades|属性|الخصائص
Anim|Animation|Animación|动画|حركة
Position & Size|Position et dimensions|Posición y tamaño|位置与尺寸|الموضع والحجم
Appearance|Apparence|Apariencia|外观|المظهر
Content|Contenu|Contenido|内容|المحتوى
Size|Taille|Tamaño|大小|الحجم
Trigger|Déclencheur|Disparador|触发方式|المشغّل
Effect|Effet|Efecto|效果|التأثير
Duration|Durée|Duración|时长|المدة
Delay|Délai|Retraso|延迟|التأخير
Mode|Mode|Modo|模式|الوضع
Standard|Standard|Estándar|常规|عادي
Fixed|Fixe|Fijo|固定|ثابت
Multiple items selected|Plusieurs objets sélectionnés|Varios objetos seleccionados|已选择多个对象|تم تحديد عدة عناصر
Pages|Pages|Páginas|页面|الصفحات
Layers|Calques|Capas|图层|الطبقات
Rename|Renommer|Renombrar|重命名|إعادة تسمية
Duplicate|Dupliquer|Duplicar|创建副本|تكرار العنصر
Delete Page|Supprimer la page|Eliminar página|删除页面|حذف الصفحة
Hyperlink|Lien hypertexte|Hipervínculo|超链接|ارتباط تشعبي
Cut|Couper|Cortar|剪切|قص
Bring to Front|Mettre au premier plan|Traer al frente|置于顶层|إحضار إلى الأمام
Send to Back|Mettre à l’arrière-plan|Enviar al fondo|置于底层|إرسال إلى الخلف
Layer|Calque|Capa|图层|طبقة`;
const codes=['fr','es','zh','ar'] as const;
export const international:Record<string,Partial<Record<Language,string>>>=Object.fromEntries(rows.split('\n').map(row=>{
  const [key,...values]=row.split('|').map(value=>value.replace(/\\n/g,'\n'));
  return [key,Object.fromEntries(codes.map((code,index)=>[code,values[index]]))];
}));
