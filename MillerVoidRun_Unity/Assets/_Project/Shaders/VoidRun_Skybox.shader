Shader "VoidRun/Skybox"
{
    Properties
    {
        _TopColor ("Sky Top", Color) = (0.04, 0.04, 0.08, 1)
        _HorizonColor ("Horizon", Color) = (0.18, 0.11, 0.31, 1)
        _AccentColor ("Void Pulse", Color) = (0.71, 0.31, 1.0, 1)
    }
    SubShader
    {
        Tags { "Queue"="Background" "RenderType"="Background" "PreviewType"="Skybox" "RenderPipeline"="UniversalPipeline" }
        Cull Off ZWrite Off
        Pass
        {
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            struct Attributes { float4 positionOS : POSITION; };
            struct Varyings { float4 positionHCS : SV_POSITION; float3 dir : TEXCOORD0; };

            CBUFFER_START(UnityPerMaterial)
                half4 _TopColor;
                half4 _HorizonColor;
                half4 _AccentColor;
            CBUFFER_END

            Varyings vert(Attributes IN)
            {
                Varyings OUT;
                OUT.positionHCS = TransformObjectToHClip(IN.positionOS.xyz);
                OUT.dir = normalize(IN.positionOS.xyz);
                return OUT;
            }

            half4 frag(Varyings IN) : SV_Target
            {
                float h = saturate(IN.dir.y * 0.5 + 0.5);
                half3 col = lerp(_HorizonColor.rgb, _TopColor.rgb, pow(h, 0.75));
                float wave = sin(IN.dir.x * 8.0 + _Time.y * 0.5) * cos(IN.dir.z * 8.0 - _Time.y * 0.3);
                col += _AccentColor.rgb * saturate(wave) * 0.12 * (1.0 - h);
                return half4(col, 1.0);
            }
            ENDHLSL
        }
    }
}
