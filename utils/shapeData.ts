export const getSvgPath = (shapeType: string) => {
    switch (shapeType) {
        case 'triangle': return "50,0 100,100 0,100";
        case 'rightTriangle': return "0,0 100,100 0,100";
        case 'diamond': return "50,0 100,50 50,100 0,50";
        case 'parallelogram': return "25,0 100,0 75,100 0,100";
        case 'trapezoid': return "25,0 75,0 100,100 0,100";
        case 'pentagon': return "50,0 100,38 82,100 18,100 0,38";
        case 'hexagon': return "25,0 75,0 100,50 75,100 25,100 0,50";
        case 'octagon': return "30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30";
        case 'star': return "50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35";
        case 'star4': return "50,0 65,35 100,50 65,65 50,100 35,65 0,50 35,35";
        case 'star6': return "50,0 65,25 100,25 75,50 100,75 65,75 50,100 35,75 0,75 25,50 0,25 35,25";
        case 'arrowRight': return "0,25 50,25 50,0 100,50 50,100 50,75 0,75";
        case 'arrowLeft': return "100,25 50,25 50,0 0,50 50,100 50,75 100,75";
        case 'arrowUp': return "25,100 25,50 0,50 50,0 100,50 75,50 75,100";
        case 'arrowDown': return "25,0 25,50 0,50 50,100 100,50 75,50 75,0";
        case 'cross': return "35,0 65,0 65,35 100,35 100,65 65,65 65,100 35,100 35,65 0,65 0,35 35,35";
        case 'heart': return "M 10,30 A 20,20 0,0,1 50,30 A 20,20 0,0,1 90,30 Q 90,60 50,90 Q 10,60 10,30 z";
        case 'message': return "0,0 100,0 100,75 20,75 0,100 0,75";
        default: return "";
    }
};
