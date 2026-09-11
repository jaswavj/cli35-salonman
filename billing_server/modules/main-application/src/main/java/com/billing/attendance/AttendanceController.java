package com.billing.attendance;

import com.billing.attendance.dto.AttendanceSaveRequest;
import com.billing.attendance.dto.AttendanceUpdateRequest;
import com.billing.core.response.ResponseDO;
import com.billing.data.AppUser;
import com.billing.security.PlatformSecurityContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final PlatformSecurityContext securityContext;

    @PostMapping
    public ResponseDO save(@RequestBody AttendanceSaveRequest request) {
        return ok(attendanceService.save(request, currentUser()));
    }

    @GetMapping("/today")
    public ResponseDO today() {
        return ok(attendanceService.today(currentUser()));
    }

    @GetMapping("/report")
    public ResponseDO report(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String shopId
    ) {
        return ok(attendanceService.report(from, to, userId, shopId));
    }

    @PostMapping("/{id}")
    public ResponseDO update(@PathVariable Long id, @RequestBody AttendanceUpdateRequest request) {
        attendanceService.update(id, request, currentUser());
        return ok(true);
    }

    private AppUser currentUser() {
        return securityContext.authenticateUser();
    }

    private ResponseDO ok(Object data) {
        ResponseDO response = new ResponseDO();
        response.setSuccess(true);
        response.setData(data);
        return response;
    }
}
