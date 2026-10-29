# QA Interview English

Trang luyện phỏng vấn QA bằng tiếng Anh: https://thanhthaonguyen680.github.io/qa-interview/

## Cấu trúc

| File | Chứa gì | Khi nào sửa |
|---|---|---|
| `data.js` | Toàn bộ nội dung: câu hỏi, câu trả lời mẫu, từ vựng, câu cứu nguy | Thêm/sửa nội dung (hầu hết mọi lần) |
| `app.js` | Logic: chuyển tab, luyện nói, kiểm tra từ vựng, câu trả lời riêng | Thêm/sửa tính năng |
| `style.css` | Giao diện, màu sáng/tối | Đổi giao diện |
| `index.html` | Khung trang | Hiếm khi |
| `qa-interview.html` | Chuyển hướng link cũ sang trang chính | Không cần sửa |

Mỗi thứ chỉ định nghĩa ở một chỗ: số câu hỏi, số từ, danh sách nhóm đều được app.js tự tính từ `data.js`.

## Thêm nội dung

- **Câu hỏi:** thêm vào `items` của nhóm phù hợp trong `qa`, kèm một `id` mới không trùng.
  Không đổi `id` của câu đã có: tiến độ và câu trả lời riêng của người học được lưu theo `id`.
- **Từ vựng:** thêm `{ w, m, e }` vào `words` của nhóm phù hợp. Câu ví dụ `e` nên chứa đúng từ `w`.
- **Nhóm mới:** thêm một phần tử `{ cat: "Tên nhóm", items/words: [...] }`.

Xem thử trên máy: mở `index.html` bằng trình duyệt. Không cần cài gì.
Đưa lên web: `git add . && git commit -m "..." && git push`, khoảng 1 phút sau trang tự cập nhật.
