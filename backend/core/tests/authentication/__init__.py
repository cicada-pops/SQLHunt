from unittest.mock import patch

patch('defender.utils.record_failed_attempt', lambda *a, **k: None).start()
patch('defender.utils.block_ip', lambda *a, **k: None).start()
patch('defender.utils.get_lockout_cooloff_time', lambda *a, **k: 0).start()