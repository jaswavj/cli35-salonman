package com.billing.attendance.dto;

import lombok.Data;

@Data
public class AttendanceSaveRequest {
    private String punchType;
    private String notes;
}
