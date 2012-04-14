
// hexmap options

/*

Hexagon map javascript implementation

*/
var hexmap = {};
    
// functions
hexmap.init = function(hexmap_params, hexmap_units) {
    // hexagon properties
    hexmap.h_list = [];
    hexmap.h_size = hexmap_params.hexmap_hex_size;
    hexmap.h_angle = 30;
    hexmap.h_angle_rad = (hexmap.h_angle*Math.PI)/180;
    hexmap.h_h = Math.sin(hexmap.h_angle_rad)*hexmap.h_size;
    hexmap.h_r = Math.cos(hexmap.h_angle_rad)*hexmap.h_size;
    hexmap.h_b = hexmap.h_size+(hexmap.h_h*2);
    hexmap.h_a = 2*hexmap.h_r;
    hexmap.h_x_range = hexmap_params.hexmap_x_size; 
    hexmap.h_y_range = hexmap_params.hexmap_y_size;
    hexmap.h_border = 1;
    hexmap.h_hovered = { hx : -1, hy : -1};
    hexmap.h_selected = { hx : -1, hy : -1};
    hexmap.h_color_normal = hexmap_params.hexmap_color_normal;
    hexmap.h_color_hover = hexmap_params.hexmap_color_hover;
    hexmap.h_color_selected = hexmap_params.hexmap_color_selected;
    
    // map properties
    hexmap.x_range = Math.floor(hexmap.h_x_range*(hexmap.h_a+hexmap.h_r));
    hexmap.y_range = Math.floor(hexmap.h_y_range*hexmap.h_b);
    
    // generate canvas element
    hexmap.obj = document.getElementById(hexmap_params.hexmap_canvas_id);
    hexmap.context = hexmap.obj.getContext("2d");
    hexmap.obj.height = hexmap.y_range;
    hexmap.obj.width = hexmap.x_range;

    hexmap.h_hexdiv = document.getElementById(hexmap_params.hexmap_info_div);
    
    //units
    hexmap.units = [];
    for(var i = 0; i < hexmap_units.length; i++){
        var unit = hexmap_units[i];
    	hexmap._log('Checking unit ' + unit + " for drawing");
    	if(unit.x != null && unit.x >= 0 && unit.y != null && unit.y >= 0){
            unit.readyToMoveTo = null; //valid value example {x: 1, y: 1}
            unit.readyToAttack = null; //valid value is another unit 
    		hexmap.units[unit.x + "," + unit.y] = unit;
    		hexmap._log('Adding unit ' + unit.name + ' at ' + unit.x + ',' + unit.y);
    	}
    }
    
    hexmap.selectedUnit = null;
    
    // drawing map
    hexmap.draw();
    
    // event listeners
    hexmap.obj.addEventListener("click", hexmap.selectHexmap, false);
    //hexmap.obj.addEventListener("mousemove", hexmap.hoverHexmap, false);
}

hexmap.draw = function() {
    var mx = 0;
    var my = 0;
    var hex_bottom_right = 0;
    var is_hovered = false;
    var is_selected = false;
    
    //clear first
    hexmap.context.fillStyle = '#fff';
    hexmap.context.fillRect(0,0,hexmap.obj.width,hexmap.obj.height);
    
    // position and drawing hexagons
    for (var hx = 0; hx < hexmap.h_x_range; hx += 1) {
        my = 0;
        if(hexmap.h_list[hx] === undefined){
            hexmap.h_list[hx] = [];
        }

        for (var hy = 0; hy < hexmap.h_y_range; hy += 1) {
        	// checking hover
        	if(hexmap.h_hovered.hx == hx && hexmap.h_hovered.hy == hy) {
        		is_hovered = true;
        	} else {
        		is_hovered = false;
        	}
        	// checking select
            if(hexmap.h_selected.hx == hx && hexmap.h_selected.hy == hy) {
                is_selected = true;
            } else {
                is_selected = false;
            }
            // set hexagon inRange of a selected unit also as selected
            if(hexmap.selectedUnit !== undefined && hexmap.selectedUnit !== null
                && hexmap.h_list[hx][hy] !== undefined
                && hexmap.h_list[hx][hy].inRange !== undefined
                && hexmap.h_list[hx][hy].inRange == true){
                is_selected = true;
            }
            
            // adding to hexagon list
            if(hexmap.h_list[hx][hy] === undefined){
                hexmap.h_list[hx][hy] = {
                    	mx : mx,
                        my : my,
                };
            }
            else{
                hexmap.h_list[hx][hy].mx = mx;
                hexmap.h_list[hx][hy].my = my;
            }
            
            
            
            // drawing hexagon
            //hexmap._log("drawing hexagon at " + hx + ", " + hy);
            hexmap._drawHexagon(mx,my,is_hovered,is_selected);
            
            // drawing unit at hexagon
        	var unit = hexmap.units[hx + "," + hy];
        	if(unit != null){
                hexmap._log("drawing unit at " + hx + ", " + hy);
        	    hexmap._drawUnit(mx, my, unit, is_hovered,is_selected);
        	}
            
            //drawing hexagon position
            hexmap._drawHexagonPosition(hx, hy);
            
            // switch top/bottom hexagon
            if(hex_bottom_right == 1) {
                mx = mx-hexmap.h_r;
                hex_bottom_right = 0;
            } else { 
                mx = mx+hexmap.h_r;
                hex_bottom_right = 1; 
            }
                 
            // y position for next hexagon
            my = my+hexmap.h_h+hexmap.h_size+hexmap.h_border;
         }
         
         // x startpoint for next hexagon line
         if(hex_bottom_right == 1) {
             mx = mx -hexmap.h_r+hexmap.h_border;
             hex_bottom_right = 0;
         }
         
         mx = mx+hexmap.h_a+hexmap.h_border;
    }
}

hexmap._getMousePosition = function(e) {
    var mp = {
    		mx : 0,
    		my : 0
    };
    if (e.pageX != undefined && e.pageY != undefined) {
      mp.mx = e.pageX;
      mp.my = e.pageY;
    }
    mp.mx -= hexmap.obj.offsetLeft;
    mp.my -= hexmap.obj.offsetTop;
    
    return mp;
}

hexmap.hoverHexmap = function(e) {
	var m_posi = hexmap._getMousePosition(e);
	var hex_posi = hexmap._getSelectedHexagon(m_posi.mx,m_posi.my);
	hexmap.h_hovered.hx = hex_posi[0];
	hexmap.h_hovered.hy = hex_posi[1];
	hexmap.draw();
}

hexmap.selectHexmap = function(e) {
    var x;
    var y;
    if (e.pageX !== undefined && e.pageY !== undefined) {
      x = e.pageX;
      y = e.pageY;
    }
    x -= hexmap.obj.offsetLeft;
    y -= hexmap.obj.offsetTop;
    var selectedHex = hexmap._getSelectedHexagon(x,y);
    hexmap.h_selected.hx = selectedHex[0];
    hexmap.h_selected.hy = selectedHex[1];
    
    var hx = hexmap.h_selected.hx;
    var hy = hexmap.h_selected.hy;
    
    //check if there is a unit
    var unit = hexmap.units[hx + "," + hy];
    if(unit !== undefined && unit !== null && hexmap.selectedUnit === null){
        
        hexmap.selectedUnit = unit;
        hexmap._setupRange(hx, hy, unit.range);
        hexmap._log("Selected unit " + unit.id);
    }
    else if ((unit === undefined || unit === null) && hexmap.selectedUnit !== null){ //selected hexagon is empty but a unit is currently selected
    
        var h_moveTo = hexmap.selectedUnit.readyToMoveTo;

        if(h_moveTo !== undefined && h_moveTo !== null){
            if(h_moveTo.x == hx && h_moveTo.y == hy){
                //move selectedUnit to selected hexagon
                hexmap._moveUnit(hexmap.selectedUnit, hx, hy);
            }
        }
    }
    else if(unit !== undefined && unit !== null && hexmap.selectedUnit !== null){
        
        if(unit.id == hexmap.selectedUnit.id){
            hexmap.selectedUnit.readyToMoveTo = null;
        }
        else{
            var attackedUnit = hexmap.selectedUnit.readyToAttack;
            if(attackedUnit !== undefined && attackedUnit !== null
            && hexmap.selectedUnit.id != attackedUnit.id){
                hexmap._attackUnit(hexmap.selectedUnit, attackedUnit);
            }
        }
    }
    
    hexmap.draw();
    hexmap._log("Selected " + hx + ", " + hy);
    
    if(unit !== undefined && unit !== null){
        
        if(hexmap.selectedUnit !== null && hexmap.selectedUnit.id != unit.id){
            
            hexmap._prepareAttack(hexmap.selectedUnit, unit);
        }
    }
    else if (hexmap.selectedUnit !== null){ //selected hexagon is empty but a unit is currently selected
    
        hexmap._prepareMove(hx, hy);
    }
}

hexmap._attackUnit = function(unitAttack, unitDefend){
    
    //for now: defender is loosing, attacker moves to defenders position
    var hx = unitDefend.x;
    var hy = unitDefend.y;
    var defenderKey = hx + ',' + hy;
    delete hexmap.units[defenderKey];
    
    unitAttack.readyToAttack = null;
    hexmap._moveUnit(unitAttack, hx, hy);
}

hexmap._moveUnit = function(unit, hx, hy){
    
    var unitKey = unit.x + "," + unit.y;
    var unitToMove = hexmap.units[unitKey];
    hexmap._log('Moving unit ' + unitToMove.id + ' to ' + hx + ',' + hy);
    unitToMove.x = hx;
    unitToMove.y = hy;
    hexmap.selectedUnit = null;
    hexmap.units[unitToMove.x + ',' + unitToMove.y] = unitToMove;
    delete hexmap.units[unitKey];
}

hexmap._prepareAttack = function(unitAttack, unitDefend){
    
    var aCenter = hexmap._getHexagonCenter(unitAttack.x, unitAttack.y);
    var dCenter = hexmap._getHexagonCenter(unitDefend.x, unitDefend.y);
    
    hexmap.context.beginPath();
    hexmap.context.moveTo(aCenter.x, aCenter.y);
    hexmap.context.lineTo(dCenter.x, dCenter.y);
    hexmap.context.strokeStyle = '#f00';
    hexmap.context.stroke();
    
    unitAttack.readyToAttack = unitDefend;
    unitAttack.readyToMoveTo = null;
}

hexmap._prepareMove = function(hx, hy){
    
    var h_moveTo = hexmap.selectedUnit.readyToMoveTo;

    if(h_moveTo === undefined || h_moveTo === null || h_moveTo.x != hx || h_moveTo.y != hy){
        
        /*
        if( h_moveTo !== undefined && h_moveTo !== null &&
            hexmap.selectedUnit.x == h_moveTo.x && hexmap.selectedUnit.y == h_moveTo.y){
            //the move is prepared to the units location, means to remove preparation
            hexmap.selectedUnit.readyToMoveTo = null;
            return;
        }
        */
        
        //movement line from selectedUnit to empty hexagon
        
        var uCenter = hexmap._getHexagonCenter(hexmap.selectedUnit.x, hexmap.selectedUnit.y);
        var hCenter = hexmap._getHexagonCenter(hx, hy);
        
        hexmap.context.beginPath();
        hexmap.context.moveTo(uCenter.x, uCenter.y);
        hexmap.context.lineTo(hCenter.x, hCenter.y);
        hexmap.context.strokeStyle = '#0f0';
        hexmap.context.stroke();
        
        if(h_moveTo === undefined || h_moveTo === null){
            hexmap.selectedUnit.readyToMoveTo = { x: hx, y: hy };
        }
        else{
            hexmap.selectedUnit.readyToMoveTo.x = hx;
            hexmap.selectedUnit.readyToMoveTo.y = hy;
        }
    }
}

hexmap._getHexagonCenter = function(hx, hy){
    if(hexmap.h_list[hx][hy] !== undefined){
        var hxCenter = hexmap.h_list[hx][hy].mx + hexmap.h_size;
        var hyCenter = hexmap.h_list[hx][hy].my + hexmap.h_size;
    }
    
    return { x: hxCenter, y: hyCenter };
}

hexmap._getSelectedHexagon = function(mx,my) {
	var rely = 0,
	    relx = 0,
	    xyangle = 0;

    for(var hx = 0;hx < hexmap.h_list.length; hx += 1) {
    	for(var hy = 0;hy < hexmap.h_list[hx].length; hy += 1) {
    		
    		if( mx > hexmap.h_list[hx][hy].mx && mx < (hexmap.h_list[hx][hy].mx+hexmap.h_a)) {
    			// matches x row
    			if( my > hexmap.h_list[hx][hy].my && my < (hexmap.h_list[hx][hy].my+hexmap.h_b)) {
    			    // matches y column
    			    relx =  mx - hexmap.h_list[hx][hy].mx;
    			    rely =  my - hexmap.h_list[hx][hy].my;
    			    
    			    if(rely > hexmap.h_h && rely < hexmap.h_h+hexmap.h_size) {
    			    	// hexagon found
                        hexmap._log("Mouse at " + hx + "," + hy);
                        return [hx,hy];
                        
                    } else {
                        // checking corners
                        if(rely < hexmap.h_h) { // hex top
                            if(relx < hexmap.h_r) { // hex left
                                xyangle = (Math.atan(relx/(hexmap.h_h-rely))*180)/Math.PI;
                            } else { // hex right
                                xyangle = (Math.atan((hexmap.h_a-relx)/(hexmap.h_h-rely))*180)/Math.PI;
                            }
                        }
                        
                        if(rely > hexmap.h_h+hexmap.h_size) { // hex bottom
                            if(relx < hexmap.h_r) { // hex left
                                xyangle = (Math.atan(relx/(rely-(hexmap.h_h+hexmap.h_size)))*180)/Math.PI;
                            } else { // hex right
                                xyangle = ((Math.atan((relx-hexmap.h_a)/(rely-(hexmap.h_h+hexmap.h_size)))*180)/Math.PI)*-1;
                            }
                        }
                        if(xyangle > 90-hexmap.h_angle) { 
                        	// hexagon found
                            hexmap._log("Mouse at " + hx + "," + hy);
                            return [hx,hy];
                        }
                    }
                }
    		}
    	}
    }
    return [-1,-1];
}

hexmap._drawHexagon = function(x,y,is_hovered,is_selected) {
	hexmap.context.beginPath();
	hexmap.context.moveTo(x+hexmap.h_r, y);
	hexmap.context.lineTo(x+hexmap.h_a, y+hexmap.h_h);
	hexmap.context.lineTo(x+hexmap.h_a, y+hexmap.h_h+hexmap.h_size);
	hexmap.context.lineTo(x+hexmap.h_r, y+hexmap.h_b);
	hexmap.context.lineTo(x, y+hexmap.h_h+hexmap.h_size);
	hexmap.context.lineTo(x, y+hexmap.h_h);
	hexmap.context.lineTo(x+hexmap.h_r, y);
    
    // change color if selected
    if(is_selected == true){
        hexmap.context.fillStyle = hexmap.h_color_selected;
    } else {
        hexmap.context.fillStyle = hexmap.h_color_normal;   
    }
	hexmap.context.fill();
	
	// draw border if hovered
	if(is_hovered == true) {
        hexmap.context.beginPath();
        hexmap.context.moveTo(x+hexmap.h_r, y);
        hexmap.context.lineTo(x+hexmap.h_a, y+hexmap.h_h);
        hexmap.context.lineTo(x+hexmap.h_a, y+hexmap.h_h+hexmap.h_size);
        hexmap.context.lineTo(x+hexmap.h_r, y+hexmap.h_b);
        hexmap.context.lineTo(x, y+hexmap.h_h+hexmap.h_size);
        hexmap.context.lineTo(x, y+hexmap.h_h);
        hexmap.context.lineTo(x+hexmap.h_r, y);
        hexmap.context.strokeStyle = hexmap.h_color_hover;
        hexmap.context.stroke();
	}
}

hexmap._drawHexagonPosition = function(hx,hy){
    
    //draw hex position
    hexmap.context.strokeStyle = '#000';
    hexmap.context.font = '30px';
    var textPos = hexmap._getHexagonCenter(hx, hy);
    hexmap.context.strokeText(hx+','+hy, textPos.x, textPos.y);
    //hexmap._log('Draw Text for hexagon '+hx+','+hy+' at '+ textPos.x+','+ textPos.y);
}

hexmap._drawUnit = function(mx,my,unit,is_hovered) {
	
    var ux = mx + hexmap.h_size / 2;
    var uy = my + hexmap.h_size / 2;
    
	var image = new Image();
    
    image.onload = function(){  
    
      if(hexmap.selectedUnit != null && hexmap.selectedUnit.id == unit.id){
          hexmap.context.drawImage(image,ux,uy, hexmap.h_size, hexmap.h_size);
      }
      else{
        hexmap.context.drawImage(image,ux,uy);  
      }
    };  
    image.src = unit.image;
    
    unit.ux = ux;
    unit.uy = uy;
}

/*                              
Range 1    			
                                 
         x,y-1   x+1,y-1

    x-1,y    x,y      x+1,y

         x,y+1   x+1,y+1


Range 2,  y = uneven                                           Range 3 - upper half, y = uneven                                            Range 3 - upper half, y = even
                                                                                                                                                                                                        
             x-1,y-2   x,y-2    x+1,y-2                                     x-1,y-3  x,y-3   x+1,y-3   x+2,y-2                                      x-2,y-3  x-1,y-3   x,y-3   x+1,y-2
                                                                                                                                                                                                        
         x-1,y-1   x,y-1   x+1,y-1    x+2,y-1                           x-2,y-2   x-1,y-2  x,y-2   x+1,y-2   x+2,y-2                            x-2,y-2   x-1,y-2  x,y-2   x+1,y-2   x+2,y-2
                                                                                                                                                                                                        
     x-2,y    x-1,y    x,y      x+1,y     x+2,y                     x-2,y-1   x-1,y-1   x,y-1  x+1,y-1   x+2,y-1   x+3,y-1                  x-3,y-1   x-2,y-1   x-1,y-1  x,y-1   x+1,y-1   x+2,y-1  
                                                                                                                                                                                                        
         x-1,y+1   x,y+1   x+1,y+1  x+2,y+1                     x-3,y     x-2,y     x-1,y    x,y     x+1,y     x+2,y     x+3,y          x-3,y     x-2,y     x-1,y    x,y     x+1,y     x+2,y     x+3,y

              x-1,y+2  x,y+2   x+1,y+2         

Range 2, distance 2: x-1    x+1		x-(d/2+(r-d))	x+(d/2+(r-d))

Range 3, distance 2: x-2	x+2		x-(d/2+(r-d))	x+(d/2+(r-d))

Range 4, distance 2: x-3	x+3		x-(d/2+(r-d))	x+(d/2+(r-d))			
Range 4, distance 4: x-2	x+2		x-(d/2+(r-d))	x+(d/2+(r-d))

Range 5, distance 2: x-4	x+4		x-(d/2+(r-d))	x+(d/2+(r-d))
Range 5, distance 4: x-3	x+3		x-(d/2+(r-d))	x+(d/2+(r-d))

Range 6, distance 2: x-5	x+5		x-(d/2+(r-d))	x+(d/2+(r-d))
Range 6, distance 4: x-4	x+4		x-(d/2+(r-d)) 	x+(d/2+(r-d))
Range 6, distance 6: x-3	x+3		x-(d/2+(r-d))	x+(d/2+(r-d))	

*/
hexmap._setupRange = function(centerX, centerY, range){
    var rangeFromY = centerY - range;
    if(rangeFromY < 0){
        rangeFromY = 0;
    }
    var rangeUntilY = centerY + range;
    if(rangeUntilY >= hexmap.h_y_range){
        rangeUntilY = hexmap.h_y_range - 1;
    }
    
    for (var hx = 0; hx < hexmap.h_x_range; hx += 1) {
        for (var hy = 0; hy < hexmap.h_y_range; hy += 1) {
            //hexmap._log('check range for ' + hx + ',' + hy);
            var distanceY = hy - centerY;
            if(distanceY < 0){
                distanceY = distanceY * -1;
            }
            
            var xRange = (distanceY/2 + (range - distanceY));
            var rangeFromX = centerX - xRange;
            var rangeUntilX = centerX + xRange;
            if(distanceY % 2 != 0){
                //uneven distance, here we have to round depending on the centerY
                if(centerY % 2 == 0){
                    rangeFromX = Math.floor(rangeFromX);
                    rangeUntilX = Math.floor(rangeUntilX);
                }
                else{
                    rangeFromX = Math.ceil(rangeFromX);
                    rangeUntilX = Math.ceil(rangeUntilX);
                }
            }
            
            if(hy >= rangeFromY && hy <= rangeUntilY && hx >= rangeFromX && hx <= rangeUntilX){
                //hexmap._log('in range: ' + hx + ',' + hy + ", distanceY=" + distanceY + ", xRange = " + xRange + ", rangeFromX = " + rangeFromX + ", rangeUntilX = " + rangeUntilX);  
                hexmap.h_list[hx][hy].inRange = true;
            }
            else{
                hexmap.h_list[hx][hy].inRange = false;
            }
        }
    }
}

hexmap._log = function(message) {
    console.log(message);
    if(hexmap.h_hexdiv != null){
        hexmap.h_hexdiv.innerHTML = message; // DEBUG
    }
}