/**
 * Tự động phân loại khoản chi dựa trên mô tả.
 * Ưu tiên: phat-trien → sinh-hoat → tieu-dung (mặc định)
 */

const KEYWORDS = {
  'phat-trien': [
    // sách
    'sách', 'book', 'ebook', 'e-book', 'audiobook', 'đọc sách', 'mua sách',
    'tạp chí', 'báo', 'tài liệu', 'giáo trình', 'giáo khoa',
    // khóa học, học tập
    'khóa học', 'khoá học', 'course', 'học phí', 'học online', 'lớp học',
    'lớp đào tạo', 'đào tạo', 'training', 'workshop', 'seminar', 'hội thảo',
    'conference', 'chứng chỉ', 'certificate', 'udemy', 'coursera', 'edx',
    'skillshare', 'masterclass', 'linkedin learning',
    // phát triển kỹ năng
    'kỹ năng', 'skill', 'coaching', 'mentoring', 'tư vấn học',
    // thể chất & tinh thần
    'gym', 'tập gym', 'fitness', 'yoga', 'pilates', 'thiền', 'meditation',
    'thể dục', 'tập thể thao', 'chạy bộ', 'bơi lội', 'bơi',
    // công cụ học tập
    'bút', 'vở', 'stationery', 'văn phòng phẩm',
  ],

  'sinh-hoat': [
    // xăng xe, đi lại
    'xăng', 'đổ xăng', 'nhiên liệu', 'xăng xe',
    'grab', 'taxi', 'xe ôm', 'xe buýt', 'bus', 'tàu', 'vé xe', 'vé tàu',
    'gửi xe', 'bãi xe', 'bãi đỗ', 'đi lại', 'di chuyển',
    // thực phẩm & ăn uống hàng ngày
    'gạo', 'mì', 'bún', 'phở', 'hủ tiếu', 'cháo', 'bánh mì',
    'rau', 'thịt', 'cá', 'tôm', 'cua', 'trứng', 'đậu phụ', 'đậu hũ',
    'sữa', 'nước mắm', 'muối', 'đường', 'dầu ăn', 'nước tương', 'tương',
    'gia vị', 'bột', 'bột mì', 'tiêu', 'tỏi', 'hành',
    'ăn sáng', 'ăn trưa', 'ăn tối', 'ăn chiều', 'bữa ăn',
    'đồ ăn', 'thức ăn', 'cơm', 'quán ăn', 'nhà hàng', 'cơm hộp', 'cơm bụi',
    'cafe', 'cà phê', 'trà', 'nước ngọt', 'nước uống', 'đồ uống',
    'siêu thị', 'chợ', 'tạp hóa', 'grocery', 'thực phẩm',
    // vệ sinh cá nhân
    'dầu gội', 'nước gội', 'dầu xả', 'sữa tắm', 'xà phòng', 'xà bông',
    'kem đánh răng', 'bàn chải', 'nước súc miệng',
    'giấy vệ sinh', 'khăn giấy', 'băng vệ sinh',
    'nước rửa tay', 'nước rửa chén', 'nước lau sàn', 'chất tẩy',
    'dưỡng da', 'kem dưỡng', 'kem chống nắng', 'son', 'phấn', 'mỹ phẩm',
    // hóa đơn & nhà ở
    'tiền điện', 'tiền nước', 'hóa đơn điện', 'hóa đơn nước',
    'tiền nhà', 'thuê nhà', 'phòng trọ', 'ký túc xá',
    'internet', 'wifi', 'cáp quang', 'tiền mạng', 'điện thoại', 'phone',
    'gas', 'bình gas', 'bill', 'hóa đơn',
    // sức khỏe
    'thuốc', 'mua thuốc', 'nhà thuốc', 'khám bệnh', 'bệnh viện',
    'phòng khám', 'y tế', 'sức khỏe', 'vitamin', 'bổ sung',
    // giặt giũ
    'giặt', 'giặt đồ', 'giặt ủi', 'tiệm giặt', 'bột giặt', 'nước giặt',
  ],
};

/**
 * @param {string} description - Mô tả giao dịch
 * @returns {'phat-trien'|'sinh-hoat'|'tieu-dung'}
 */
function categorize(description) {
  if (!description) return 'tieu-dung';

  const normalized = description
    .toLowerCase()
    .normalize('NFC');

  for (const [cat, keywords] of Object.entries(KEYWORDS)) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) return cat;
    }
  }

  return 'tieu-dung';
}

module.exports = { categorize };
