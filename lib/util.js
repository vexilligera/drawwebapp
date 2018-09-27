var _clrReg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;

String.prototype.colorHex = function(){
     var that = this;
     if(/^(rgb|RGB)/.test(that)){
          var aColor = that.replace(/(?:\(|\)|rgb|RGB)*/g,"").split(",");
          var strHex = "#";
          for(var i=0; i<aColor.length; i++){
               var hex = Number(aColor[i]).toString(16);
               if(hex === "0"){
                    hex += hex;    
               }
               strHex += hex;
          }
          if(strHex.length !== 7){
              that = that.toLowerCase();
               that = that.replace('rgb(', '');
               that = that.replace(')', '');
               that = that.replace(' ', '');
               var t = that.split(',');
               for (var i in t) {
                    t[i] = parseInt(t[i]);
                    t[i] = t[i].toString(16);
                    if (t[i].length == 1)
                         t[i] = '0' + t[i];
               }
               return '#' + t[0] + t[1] + t[2];
          }
          return strHex;
     }else if(_clrReg.test(that)){
          var aNum = that.replace(/#/,"").split("");
          if(aNum.length === 6){
               return that;    
          }else if(aNum.length === 3){
               var numHex = "#";
               for(var i=0; i<aNum.length; i+=1){
                    numHex += (aNum[i]+aNum[i]);
               }
               return numHex;
          }
     }else{
          return that;
     }
};

String.prototype.colorRgb = function(){
     var sColor = this.toLowerCase();
     if(sColor && _clrReg.test(sColor)){
          if(sColor.length === 4){
               var sColorNew = "#";
               for(var i=1; i<4; i+=1){
                    sColorNew += sColor.slice(i,i+1).concat(sColor.slice(i,i+1));    
               }
               sColor = sColorNew;
          }
          //处理六位的颜色值
          var sColorChange = [];
          for(var i=1; i<7; i+=2){
               sColorChange.push(parseInt("0x"+sColor.slice(i,i+2)));    
          }
          return "RGB(" + sColorChange.join(",") + ")";
     }else{
          return sColor;    
     }
};

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1)
        s = h[0], v = h[1], h = h[2];
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function RGBtoHSV(r, g, b) {
    if (arguments.length === 1)
        g = r[0], b = r[1], r = r[2];
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;
    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return [h, s, v];
}

function RgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0;
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [Math.floor(h * 100), Math.round(s * 100) + "%", Math.round(l * 100) + "%"];
}

function arrayToRGB(arr) {
    return 'rgb(' + arr[0].toString() + ',' + arr[1].toString() + ',' + arr[2].toString() + ')';
}

function arrayToHSL(arr) {
    return 'hsl(' + arr[0].toString() + ',' + arr[1].toString() + ',' + arr[2].toString() + ')';
}

function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}