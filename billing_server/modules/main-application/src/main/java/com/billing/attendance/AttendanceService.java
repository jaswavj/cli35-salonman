package com.billing.attendance;

import com.billing.attendance.dto.AttendanceReportData;
import com.billing.attendance.dto.AttendanceRow;
import com.billing.attendance.dto.AttendanceSaveRequest;
import com.billing.attendance.dto.AttendanceUpdateRequest;
import com.billing.data.AppUser;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Time;
import java.time.Duration;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private static final Set<String> PUNCH_TYPES = Set.of("in", "out");

    private static final String SELECT_ROWS =
            "SELECT a.id, a.punch_type AS punchType, IFNULL(a.notes,'') AS notes, " +
                    "a.shop_id AS shopId, IFNULL(o.shop_name, a.shop_id) AS shopName, " +
                    "a.uid AS userId, IFNULL(NULLIF(u.fullName,''), u.user_name) AS userName, " +
                    "DATE_FORMAT(a.punch_date, '%d-%m-%Y') AS punchDate, " +
                    "TIME_FORMAT(a.punch_time, '%h:%i %p') AS punchTime, " +
                    "DATE_FORMAT(a.punch_date, '%Y-%m-%d') AS punchDateIso, " +
                    "TIME_FORMAT(a.punch_time, '%H:%i') AS punchTimeIso " +
                    "FROM attendance a " +
                    "LEFT JOIN users u ON u.id = a.uid " +
                    "LEFT JOIN outlets o ON o.shop_id = a.shop_id";

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void ensureTable() {
        jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS attendance (" +
                        "id INT UNSIGNED NOT NULL AUTO_INCREMENT," +
                        "punch_type VARCHAR(10) NOT NULL," +
                        "notes TEXT," +
                        "shop_id VARCHAR(255) DEFAULT NULL," +
                        "uid INT DEFAULT NULL," +
                        "punch_date DATE DEFAULT NULL," +
                        "punch_time TIME DEFAULT NULL," +
                        "PRIMARY KEY (id)" +
                        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    }

    @Transactional
    public Map<String, Object> save(AttendanceSaveRequest request, AppUser user) {
        requireUser(user);
        String punchType = punchType(request == null ? null : request.getPunchType());
        String notes = request == null || request.getNotes() == null ? "" : request.getNotes().trim();
        String shopId = user.shopId();
        if (shopId == null || shopId.isBlank()) {
            throw new RuntimeException("Shop ID is missing from session");
        }
        String lastType = lastPunchTypeToday(user.getId(), shopId);
        if ("in".equals(punchType) && "in".equals(lastType)) {
            throw new RuntimeException("Already punched IN. Punch OUT first.");
        }
        if ("out".equals(punchType) && !"in".equals(lastType)) {
            throw new RuntimeException("Punch IN first.");
        }

        KeyHolder keys = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO attendance (punch_type, notes, shop_id, uid, punch_date, punch_time) " +
                            "VALUES (?, ?, ?, ?, CURDATE(), CURTIME())",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, punchType);
            ps.setString(2, notes);
            ps.setString(3, shopId);
            ps.setLong(4, user.getId());
            return ps;
        }, keys);
        Number key = keys.getKey();
        return Map.of("id", key == null ? 0 : key.longValue());
    }

    public AttendanceReportData today(AppUser user) {
        requireUser(user);
        String shopId = user.shopId();
        if (shopId == null || shopId.isBlank()) {
            throw new RuntimeException("Shop ID is missing from session");
        }
        return query(
                " WHERE a.uid = ? AND a.shop_id = ? AND a.punch_date = CURDATE() ORDER BY a.punch_time, a.id",
                user.getId(),
                shopId
        );
    }

    public AttendanceReportData report(String from, String to, Long userId, String shopId) {
        if (from == null || from.isBlank() || to == null || to.isBlank()) {
            throw new RuntimeException("From date and to date are required");
        }
        StringBuilder sql = new StringBuilder(" WHERE a.punch_date BETWEEN ? AND ?");
        List<Object> args = new ArrayList<>();
        args.add(from);
        args.add(to);
        if (userId != null && userId > 0) {
            sql.append(" AND a.uid = ?");
            args.add(userId);
        }
        if (shopId != null && !shopId.isBlank()) {
            sql.append(" AND a.shop_id = ?");
            args.add(shopId);
        }
        sql.append(" ORDER BY a.punch_date, a.punch_time, a.id");
        return query(sql.toString(), args.toArray());
    }

    @Transactional
    public void update(Long id, AttendanceUpdateRequest request, AppUser user) {
        requireUser(user);
        if (id == null) {
            throw new RuntimeException("Attendance not found");
        }
        Integer exists = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM attendance WHERE id = ?", Integer.class, id);
        if (exists == null || exists == 0) {
            throw new RuntimeException("Attendance not found");
        }
        String punchType = punchType(request == null ? null : request.getPunchType());
        String punchDate = request == null ? null : request.getPunchDate();
        String punchTime = request == null ? null : request.getPunchTime();
        if (punchDate == null || punchDate.isBlank() || punchTime == null || punchTime.isBlank()) {
            throw new RuntimeException("Date and time are required");
        }
        String notes = request == null || request.getNotes() == null ? "" : request.getNotes().trim();
        Date date;
        Time time;
        try {
            date = Date.valueOf(punchDate.trim());
            time = Time.valueOf(normalizeTime(punchTime.trim()));
        } catch (RuntimeException ex) {
            throw new RuntimeException("Enter a valid date and time");
        }
        jdbcTemplate.update(
                "UPDATE attendance SET punch_type = ?, punch_date = ?, punch_time = ?, notes = ? WHERE id = ?",
                punchType,
                date,
                time,
                notes,
                id
        );
    }

    private AttendanceReportData query(String where, Object... args) {
        List<AttendanceRow> rows = jdbcTemplate.query(SELECT_ROWS + where, (rs, i) -> mapRow(rs), args);
        AttendanceReportData data = new AttendanceReportData();
        data.setRows(rows);
        data.setCount(rows.size());
        data.setInCount((int) rows.stream().filter(r -> "in".equalsIgnoreCase(r.getPunchType())).count());
        data.setOutCount((int) rows.stream().filter(r -> "out".equalsIgnoreCase(r.getPunchType())).count());
        data.setWorkMinutes(workMinutes(rows));
        return data;
    }

    private AttendanceRow mapRow(ResultSet rs) throws SQLException {
        AttendanceRow row = new AttendanceRow();
        row.setId(rs.getLong("id"));
        row.setPunchType(rs.getString("punchType"));
        row.setNotes(rs.getString("notes"));
        row.setShopId(rs.getString("shopId"));
        row.setShopName(rs.getString("shopName"));
        long userId = rs.getLong("userId");
        row.setUserId(rs.wasNull() ? null : userId);
        row.setUserName(rs.getString("userName"));
        row.setPunchDate(rs.getString("punchDate"));
        row.setPunchTime(rs.getString("punchTime"));
        row.setPunchDateIso(rs.getString("punchDateIso"));
        row.setPunchTimeIso(rs.getString("punchTimeIso"));
        return row;
    }

    private long workMinutes(List<AttendanceRow> rows) {
        Map<String, List<AttendanceRow>> groups = new LinkedHashMap<>();
        for (AttendanceRow row : rows) {
            String key = String.valueOf(row.getUserId()) + "|" + row.getPunchDateIso();
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(row);
        }
        long total = 0;
        for (List<AttendanceRow> list : groups.values()) {
            list.sort(Comparator
                    .comparing(AttendanceRow::getPunchTimeIso, Comparator.nullsLast(String::compareTo))
                    .thenComparing(AttendanceRow::getId, Comparator.nullsLast(Long::compareTo)));
            LocalTime pendingIn = null;
            for (AttendanceRow row : list) {
                LocalTime time = parseTime(row.getPunchTimeIso());
                if (time == null) {
                    continue;
                }
                if ("in".equalsIgnoreCase(row.getPunchType())) {
                    pendingIn = time;
                } else if ("out".equalsIgnoreCase(row.getPunchType()) && pendingIn != null) {
                    long minutes = Duration.between(pendingIn, time).toMinutes();
                    if (minutes > 0) {
                        total += minutes;
                    }
                    pendingIn = null;
                }
            }
        }
        return total;
    }

    private LocalTime parseTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalTime.parse(normalizeTime(value));
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private String normalizeTime(String value) {
        if (value.length() == 5) {
            return value + ":00";
        }
        return value;
    }

    private String lastPunchTypeToday(Long userId, String shopId) {
        List<String> rows = jdbcTemplate.query(
                "SELECT punch_type FROM attendance WHERE uid = ? AND shop_id = ? AND punch_date = CURDATE() " +
                        "ORDER BY punch_time DESC, id DESC LIMIT 1",
                (rs, i) -> rs.getString(1),
                userId,
                shopId
        );
        return rows.isEmpty() ? null : rows.get(0);
    }

    private String punchType(String value) {
        String punchType = value == null ? "" : value.trim().toLowerCase();
        if (!PUNCH_TYPES.contains(punchType)) {
            throw new RuntimeException("Select In or Out");
        }
        return punchType;
    }

    private void requireUser(AppUser user) {
        if (user == null || user.getId() == null) {
            throw new RuntimeException("Not signed in");
        }
    }
}
