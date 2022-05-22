# Лабораторна робота №1. Локалізація точки на планарному розбитті методом ланцюгів

## Веб-інтерфейс

Веб-додаток доступний за посиланням [https://nksazonov.github.io/computational-geometry-lab-1/](https://nksazonov.github.io/computational-geometry-lab-1/).

### Дошка

Дошка, що розташована у верхній частині екрану, дозволяє створювати графи для тестування методу ланцюгів.

Доступні наступні дії:

- Створити точку - натисніть ЛКМ по порожньому місцю на дошці
- Обрати точку - натисніть ЛКМ по вже існуючій точці. Тоді ця точка стане вибраною і буде підсвічуватися кольором.
- Створити ребро - можна зробити двома діями. По-перше, ви можете обрати точку, а потім клікнути по іншій точці. По-друге, ви можете обрати точку і клікнути в порожнє місце дошки. Тоді на цьому місці буде створено точку і одразу проведено ребро до неї. Варто зауважити, що створювати мультиребра не можна.
- Обрати ребро - натисніть ЛКМ по вже існуючому ребру. Обрані ребра, як і обрані точки, підсвічуються кольором.

Також біля кожного ребра позначено його вагу, яка може змінитися після запуску методу ланцюгів.

Після завершення роботи методу на дошці також з'являться два типи ланцюгів:

- обмежуючі (enclosing) - саме вони є результатом локалізації точки в ППЛГ.
- загальні (all) - ланцюги, отримані в результаті роботи алгоритму. Вони мають різний колір та різну товщину, аби їх було видно при накладанні один на одного.

### Кнопки дії

Під дошкою розташовано 8 кнопок, зліва направо:

- `Run Monotone subdivisions method` - натискання на цю кнопку запустить алгоритм ланцюгів, результатом якого будуть *обмежуючі* (які одразу з'являються на дошці) та *загальні* ланцюги. Для запуску алгоритму потрібно створити як мінімум 3 точки, і обрати ту, яка не має інцедентних ребер.
- `/\ Example 1 /\` - додає на дошку завчасно збережений граф 1. Для запуску алгоритму потрібно додати точку у будь-яке місце дошки і обрати її.
- `/\ Example 2 /\` - додає на дошку завчасно збережений граф 2. Для запуску алгоритму потрібно додати точку у будь-яке місце дошки і обрати її.
- `\/ Save \/` - зберігає всі точки та ребра, що присутні на дошці, у пам'ять. Якщо вже присутня збережена дошка, то вона перезаписується новою.
- `/\ Load /\` - додає збережені точки та ребра на дошку.
- `Toggle chains` - кнопка для маніпуляції ланцюгами. Відповідно до типу ланцюгів, що відображаються, змінюється напис на ній. Спочатку ланцюгів не побудовано, тому присутній напис "No chains to show". Після завершення роботи алгоритму і додавання обох типів ланцюгів у пам'ять, відображаються *обмежуючі*, а напис кнопки змінюється на "Show all chains". При натисканні на кнопку, на дошці відображаються *загальні ланцюги*, а напис на кнопці змінюється на "Hide all chains". При її повторному натисканні, з дошки зникають всі типи ланцюгів, а напис змінюється на "Show enclosing chains".
- `Clear all` - видалити всі точки, ребра та ланцюги з дошки.
- `X Delete X` - видаляє обраний елемент. Якщо обрано точку - то видаляє всі інцедентні до неї ребра.

## Реалізація алгоритму

Алгоритм реалізовано на мові **JavaSript** із застосуванням бібліотеки **TypeScript** для уможливлення строгої типізації.

Основний код алгоритму присутній у файлі [`monotone-subdivisions.ts`](https://github.com/nksazonov/computational-geometry-lab-1/blob/master/src/algorithms/monotone-subdivisions.ts), допоміжні функції визначено у файлі [`point-locations.ts`](https://github.com/nksazonov/computational-geometry-lab-1/blob/master/src/algorithms/point-locations.ts).

### locatePoint

Метод ланцюгів реалізовано у функції [`locatePoint`](https://github.com/nksazonov/computational-geometry-lab-1/blob/master/src/algorithms/monotone-subdivisions.ts#L13). Спочатку створюється граф, до якого додаються точки в порядку зростання, а також напрамлені ребра від меншої до більшої точки. Далі перевіряється, [чи граф регулярний](#isRegular), і якщо ні - [регуляризується](#regularize). Після цього граф [балансується](#balance), [розбивається на ланцюги](#locateChains) і відбувається [пошук обмежуючих ланцюгів](#locateEnclosingChains).

### isRegular

Перевірка на регулярність реалізована у функції [`isRegular`](https://github.com/nksazonov/computational-geometry-lab-1/blob/master/src/algorithms/monotone-subdivisions.ts#L67), і відбувається шляхом проходу від 2 (індексація з 1) до передостанньої вершини з перевіркою, чи наявне хоча б одне вхідне і вихідне ребро. Якщо ні - граф нерегулярний.

### regularize

Регуляризація графа реалізована у функції [`regularize`](https://github.com/nksazonov/computational-geometry-lab-1/blob/master/src/algorithms/monotone_subdivisions.ts#L87) і складається з двох частин: проходження згори вниз і знизу вгору. При проходженні згори вниз шукаються вершини, які не мають вихідних ребер. Від такої вершини проводиться ребро до наближчої вершини у верхній напівплощині, яка знаходиться між двома ребрами, що оточують знайдену вершину. При проходженні знизу вгору відбувається симетрична ситуація, але шукаються вершини, що не мають вхідних ребер, та від них проводиться ребро до найближчої знизу вершини.

### balance

Балансування графу реалізовано у функції [`balance`](https://github.com/nksazonov/computational-geometry-lab-1/blob/master/src/algorithms/monotone-subdivisions.ts#L177). Воно складається з двох проходжень: знизу вгору і згори донизу. Під час проходження знизу вгору перевіряється, чи вага вхідних ребер менша або рівна за вагу вихідних. Якщо ні - тоді збільшується вага найлівішого за кутом до осі абсцис ребра так, аби збалансувати ваги вхідних і вихідних. Під час проходження згори донизу відбувається симетрична ситуація, але шукаються точки, для яких вага вхідних ребер менша за вагу вихідних. Тоді аналогічно збільшується вага найлівішого для цієї точки ребра.

### locateChains

Розбивання на ланцюги реалізовано у фукнції [`locateChains`](https://github.com/nksazonov/computational-geometry-lab-1/blob/master/src/algorithms/monotone-subdivisions.ts#L251) і є доволі простим: поки ми можемо вийти з нижньої вершини (витоку), ми проходимося шляхом найлівіших ребер, зменшуючи їх вагу. Якщо вага стала нулем, видаляємо ребро. Коли входимо до верхньої вершини, додаємо цей ланцюг до масиву і починаємо спочатку. Таким чином, ми отримаємо масив сортованих ланцюгів.

### locateEnclosingChains

Пошук обмежуючих ланцюгів визначено у функції [`locateEnclosingChains`](https://github.com/nksazonov/computational-geometry-lab-1/blob/master/src/algorithms/monotone-subdivisions.ts#L304) і фактично є бінарним пошуком. Спочатку перевіряється, якщо всього ланцюг один - то він і повертається. Якщо точка знаходиться вище або нижче відповідно найвищої чи найнижчої точки графа - повертаємо найлівіше та найправіше ланцюги. Вони і є тим одним ланцюгом, який відділяє зовнішню точку від графа. Якщо ж ця точка знаходиться між найнижчою і найвижчою точками за ординатою, виконуємо бінарний пошук, шукаючи, чи знаходиться точка між двома ланцюгами, або по один бік від них. Якщо між ланцюгами - вони повертаються. Якщо по якусь сторону - змінюємо границі бінарного пошуку. Перевірка, чи лежить точка між двома ланцюгами, реалізована у функції [`pointRelativeToChains`](#pointRelativeToChains).

### pointRelativeToChains

Перевірка, чи лежить точка між двома ланцюгами, реалізована у функції [`pointRelativeToChains`](https://github.com/nksazonov/computational-geometry-lab-1/blob/master/src/algorithms/monotone-subdivisions.ts#L349). Якщо отриманий з параметрів лівий ланцюг дійсно є лівим, а правий правим - точка між ланцюгами. Якщо лівий не є лівим, а правий є правим - точка лівіше за ці два ланцюги. Якщо лівий є лівим, але правий не є правим - точка лівіше за ці ланцюги. Якщо ж точка не є ні лівішою за лівий, ні правішою за правий ланцюг - повертається помилка, оскільки виникнення цієї ситуації пояснюється тільки помилками в реалізації [порівняння розташування точки і ланцюга](#isLeftChain,-isRightChain).

### isLeftChain, isRightChain

Порівняння розташування ланцюга лівіше чи правіше за точку визначено у функціях [`isLeftChain`](https://github.com/nksazonov/computational-geometry-lab-1/blob/master/src/algorithms/monotone-subdivisions.ts#L361) та [`isRightChain`](https://github.com/nksazonov/computational-geometry-lab-1/blob/master/src/algorithms/monotone-subdivisions.ts#L371) відповідно. Шукається ребро, між кінцями якого розташована точка, і потім за допомогою орієнтованої площі перевіряється, чи розташоване це ребро справа чи зліва. Такий результат і є правдивим для всього ланцюга.
