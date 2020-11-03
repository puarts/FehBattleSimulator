#include <emscripten.h>

extern "C"
{
    EMSCRIPTEN_KEEPALIVE void freePointer(uint8_t *p)
    {
        free(p);
    }
}
