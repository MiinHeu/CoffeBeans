import { Products, Types } from './db.js';
import { qs, qsa } from './utils.js';

export function renderProductForm() {
    return `
    <form id="pf" class="grid-3">
        <label>Loại
            <select id="ptype" required>
                ${Types.list()
                    .filter(t => !t.hidden)
                    .map(t => `<option value="${t.id}">${t.name}</option>`)
                    .join('')}
            </select>
        </label>
        <label>Mã <input id="pcode" required placeholder="ARB-250"></label>
        <label>Tên <input id="pname" required placeholder="Arabica Premium 250g"></label>
        <label>Hình (URL) <input id="pimg" placeholder="https://..."></label>
        <label>Giá bán (VND) <input id="pprice" type="number" min="0" required></label>
        <label class="grid-2" style="grid-column:1/-1">Mô tả<textarea id="pdesc"></textarea></label>
        
        <h3 style="grid-column:1/-1;margin:10px 0">Thông số kỹ thuật</h3>
        <label>Khối lượng <input id="pweight" placeholder="250g"></label>
        <label>Độ rang 
            <select id="proast">
                <option value="Nhẹ">Nhẹ</option>
                <option value="Vừa">Vừa</option>
                <option value="Đậm">Đậm</option>
            </select>
        </label>
        <label>Đóng gói <input id="ppack" placeholder="Túi có van thoát khí"></label>
        <label>Bảo quản <input id="pshelf" placeholder="12 tháng kể từ ngày sản xuất"></label>
        <label>Xuất xứ <input id="porigin" placeholder="Việt Nam"></label>
        <label>Độ cao <input id="paltitude" placeholder="1500m"></label>
        <label>Chế biến
            <select id="pprocess">
                <option value="Ướt">Ướt</option>
                <option value="Khô">Khô</option>
                <option value="Mật ong">Mật ong</option>
            </select>
        </label>
        <div class="row" style="grid-column:1/-1">
            <button class="btn-primary" type="submit">Lưu</button>
            <button id="resetP" class="btn" type="button">Làm mới</button>
        </div>
    </form>`;
}

export function getProductFormData() {
    return {
        typeId: qs("#ptype").value,
        code: qs("#pcode").value.trim(),
        name: qs("#pname").value.trim(),
        image: qs("#pimg").value.trim(),
        price: parseInt(qs("#pprice").value) || 0,
        desc: qs("#pdesc").value.trim(),
        specs: {
            weight: qs("#pweight").value.trim(),
            roastLevel: qs("#proast").value,
            packaging: qs("#ppack").value.trim(),
            shelfLife: qs("#pshelf").value.trim(),
            origin: qs("#porigin").value.trim(),
            altitude: qs("#paltitude").value.trim(),
            processingMethod: qs("#pprocess").value
        }
    };
}

export function setProductFormData(product) {
    if (!product) {
        qs("#pf").reset();
        return;
    }
    
    qs("#ptype").value = product.typeId;
    qs("#pcode").value = product.code || '';
    qs("#pname").value = product.name || '';
    qs("#pimg").value = product.image || '';
    qs("#pprice").value = product.price || '';
    qs("#pdesc").value = product.desc || '';
    
    // Set specs
    if (product.specs) {
        qs("#pweight").value = product.specs.weight || '';
        qs("#proast").value = product.specs.roastLevel || 'Vừa';
        qs("#ppack").value = product.specs.packaging || '';
        qs("#pshelf").value = product.specs.shelfLife || '';
        qs("#porigin").value = product.specs.origin || '';
        qs("#paltitude").value = product.specs.altitude || '';
        qs("#pprocess").value = product.specs.processingMethod || 'Ướt';
    }
}